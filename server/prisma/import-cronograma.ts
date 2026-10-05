import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { parsearCronograma } from "../src/infrastructure/import/cronogramaParser.js";

/**
 * Importa el "CRONOGRAMA DE FABRICACIÓN" real de la planta (una planilla de
 * Drive por área) a Semana + Orden. Ver AUDITORIA-DATOS.md.
 *
 * Entrada: archivos .md en prisma/seed-data/cronograma/, uno por área,
 * nombrados `<AREA_CODE>.md` (ej. BFS_PGV_321.md, VIDRIO.md), exportados tal
 * cual vienen de Google Sheets (tabla markdown, celdas `[merged]` incluidas).
 *
 * Es idempotente: un lote ya importado se reconoce por su Nº de lote.
 * Las semanas ya terminadas se crean en estado "cerrado" (son histórico); la
 * semana en curso y las futuras, en "publicado".
 *
 *   npx tsx prisma/import-cronograma.ts
 */

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CRONOGRAMA_DIR = path.join(__dirname, "seed-data", "cronograma");

const hoy = new Date();
const inicioDeHoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

function lunesDeLaSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * En División Plástico la planilla nombra la máquina física y el catálogo la
 * familia de producto que sale de ella. Se mapea explícito porque los nombres
 * no se parecen lo suficiente como para resolverlos por similitud.
 */
const MAQUINA_A_PRODUCTO: [RegExp, string][] = [
  [/inyectoras\s+fb\s*160r/i, "INYECTORAS FB 160R - FB 230R"],
  [/sopladora\s+de\s+bidones/i, "Soplado de bidones x 10 litros"],
  [/tapas\s+azules|sound\s+se/i, "INYECTORAS TAPAS BIDONES AZUL 10 L"],
  [/tapas\s+de\s+bidones\s+rojas/i, "INYECTORAS TAPAS BIDONES ROJAS 10 L"],
  [/refiladora/i, "REFILADORA"],
];

function productoDeMaquina(maquina: string): string | null {
  for (const [patron, producto] of MAQUINA_A_PRODUCTO) {
    if (patron.test(maquina)) return producto;
  }
  return null;
}

async function main() {
  let archivos: string[];
  try {
    archivos = readdirSync(CRONOGRAMA_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    console.error(
      `No existe ${CRONOGRAMA_DIR}.\n` +
        `Exportá ahí cada planilla de Drive como <AREA_CODE>.md (ej. BFS_PGV_321.md, VIDRIO.md).`
    );
    process.exit(1);
  }
  if (archivos.length === 0) {
    console.error(`No hay planillas .md en ${CRONOGRAMA_DIR}`);
    process.exit(1);
  }

  const superadminUsername = process.env.SEED_SUPERADMIN_USERNAME ?? "superadmin";
  const superadmin = await prisma.user.findUnique({ where: { username: superadminUsername } });
  if (!superadmin) throw new Error(`No existe el usuario ${superadminUsername}. Corré primero el seed.`);

  let totalOrdenes = 0;
  let totalCumplidos = 0;
  let totalCancelados = 0;
  const productosNoEncontrados = new Set<string>();

  for (const archivo of archivos) {
    const areaCode = path.basename(archivo, ".md");
    const area = await prisma.area.findUnique({ where: { code: areaCode } });
    if (!area) {
      console.warn(`⚠ Área desconocida: ${areaCode} (archivo ${archivo}), se omite`);
      continue;
    }

    const { programado, cumplido, cancelados } = parsearCronograma(
      readFileSync(path.join(CRONOGRAMA_DIR, archivo), "utf-8")
    );
    console.log(
      `\n${areaCode}: ${programado.length} lotes programados · ${cumplido.length} cumplidos · ${cancelados.size} cancelados`
    );

    // Índice de productos del área: la planilla usa el nombre comercial con
    // el envase pegado ("Solución Fisiológica 0,9% - Flex"), no el código.
    const productos = await prisma.product.findMany({ where: { areaId: area.id, validTo: null } });
    const porNombre = new Map(productos.map((p) => [normalizar(p.nombre), p]));
    const cumplidoPorLote = new Map(cumplido.map((c) => [c.numeroLote, c]));

    for (const fila of programado) {
      const yaExiste = await prisma.orden.findFirst({ where: { numeroLote: fila.numeroLote } });
      if (yaExiste) continue;

      const clave = normalizar(productoDeMaquina(fila.productoNombre) ?? fila.productoNombre);
      let producto = porNombre.get(clave);
      if (!producto) {
        for (const [nombre, p] of porNombre) {
          if (clave.startsWith(nombre) || nombre.startsWith(clave)) {
            producto = p;
            break;
          }
        }
      }
      if (!producto) {
        productosNoEncontrados.add(`${areaCode}: ${fila.productoNombre}`);
        continue;
      }

      const inicio = lunesDeLaSemana(fila.fecha);
      const fin = new Date(inicio);
      fin.setUTCDate(fin.getUTCDate() + 6);

      // Solo lo que ya terminó es histórico. La semana en curso y las futuras
      // vienen de una planilla que la planta ya está usando: quedan
      // publicadas, para que se puedan seguir reprogramando en el tablero.
      const yaTermino = fin.getTime() < inicioDeHoyUTC;
      const semana = await prisma.semana.upsert({
        where: { areaId_fechaInicio: { areaId: area.id, fechaInicio: inicio } },
        update: {},
        create: yaTermino
          ? { areaId: area.id, fechaInicio: inicio, fechaFin: fin, estado: "cerrado", closedAt: new Date() }
          : { areaId: area.id, fechaInicio: inicio, fechaFin: fin, estado: "publicado", publishedAt: new Date() },
      });

      const c = cumplidoPorLote.get(fila.numeroLote);
      const real = c?.cantidad ?? null;

      // Un lote mencionado en una nota de cancelación pero que después SÍ
      // aparece con cantidad cumplida fue re-emitido: manda el cumplido. Solo
      // se marca cancelado si nunca llegó a producirse.
      const motivoCancelacion = real === null ? cancelados.get(fila.numeroLote) ?? null : null;
      const estado = real !== null ? "terminada" : motivoCancelacion ? "cancelada" : "en_proceso";

      await prisma.$transaction(async (tx) => {
        const orden = await tx.orden.create({
          data: {
            semanaId: semana.id,
            areaId: area.id,
            fecha: fila.fecha,
            // La planilla de fabricación no discrimina turno; se registra en
            // mañana y se ajusta desde la app si corresponde.
            turno: "manana",
            productId: producto!.id,
            opCode: fila.opCode,
            numeroLote: fila.numeroLote,
            correlativoFabricacion: fila.correlativoFabricacion,
            correlativoProduccion: fila.correlativoProduccion,
            fechaVencimiento: fila.fechaVencimiento,
            volumenUnitarioL: fila.volumenUnitarioL,
            volumenTotalL: fila.volumenTotalL,
            planificado: fila.planificado ?? 0,
            real,
            fechaInicioReal: c?.fechaInicio ?? null,
            fechaFinReal: c?.fechaFin ?? null,
            observaciones: c?.observaciones ?? fila.observaciones,
            estado,
            motivoCancelacion,
            createdByUserId: superadmin.id,
          },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: superadmin.id,
            actorUsername: superadmin.username,
            action: "ORDEN_IMPORT_CRONOGRAMA",
            entityType: "Orden",
            entityId: orden.id,
            afterJson: {
              ...orden,
              origen: `Drive · cronograma de fabricación ${areaCode}`,
            } as unknown as object,
          },
        });
      });

      totalOrdenes++;
      if (real !== null) totalCumplidos++;
      if (motivoCancelacion) totalCancelados++;
    }
  }

  console.log(
    `\n✔ ${totalOrdenes} órdenes importadas · ${totalCumplidos} con cumplido · ${totalCancelados} canceladas.`
  );
  if (productosNoEncontrados.size > 0) {
    console.log(`\n⚠ ${productosNoEncontrados.size} productos de la planilla no están en el catálogo:`);
    for (const p of productosNoEncontrados) console.log("  -", p);
    console.log("  Revisá si falta darlos de alta en Productos o si cambió el nombre.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

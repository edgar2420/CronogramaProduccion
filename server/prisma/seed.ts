import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type CatalogoProducto = { codigo: string; nombre: string; vol?: string; envase?: string };
type CatalogoData = {
  areas: { code: string; name: string }[];
  productsByArea: Record<string, CatalogoProducto[]>;
};

async function main() {
  const raw = readFileSync(path.join(__dirname, "seed-data", "catalogo.json"), "utf-8");
  const catalogo: CatalogoData = JSON.parse(raw);

  console.log(`Sembrando ${catalogo.areas.length} áreas...`);
  const areaIdByCode = new Map<string, string>();
  for (const area of catalogo.areas) {
    const saved = await prisma.area.upsert({
      where: { code: area.code },
      update: { name: area.name },
      create: { code: area.code, name: area.name },
    });
    areaIdByCode.set(area.code, saved.id);
  }

  const superadminUsername = process.env.SEED_SUPERADMIN_USERNAME ?? "superadmin";
  const superadminPassword = process.env.SEED_SUPERADMIN_PASSWORD;
  if (!superadminPassword) {
    throw new Error(
      "SEED_SUPERADMIN_PASSWORD no está definido en el entorno. Defínelo en server/.env antes de sembrar (no se usa una contraseña por defecto por seguridad)."
    );
  }

  console.log("Sembrando usuario superadmin inicial...");
  const passwordHash = await bcrypt.hash(superadminPassword, 12);
  const superadmin = await prisma.user.upsert({
    where: { username: superadminUsername },
    update: {},
    create: {
      username: superadminUsername,
      name: "Administrador del sistema",
      role: "superadmin",
      passwordHash,
    },
  });

  let productCount = 0;
  for (const [areaCode, productos] of Object.entries(catalogo.productsByArea)) {
    const areaId = areaIdByCode.get(areaCode);
    if (!areaId) {
      console.warn(`Área desconocida en catálogo: ${areaCode}, se omiten sus productos`);
      continue;
    }
    for (const producto of productos) {
      const existing = await prisma.product.findFirst({
        where: { areaId, codigo: producto.codigo, validTo: null },
      });
      if (existing) continue; // ya sembrado en una corrida anterior; no se duplica

      await prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: {
            productGroupId: crypto.randomUUID(),
            version: 1,
            codigo: producto.codigo,
            nombre: producto.nombre,
            vol: producto.vol,
            envase: producto.envase,
            areaId,
            createdByUserId: superadmin.id,
          },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: superadmin.id,
            actorUsername: superadmin.username,
            action: "PRODUCT_SEED",
            entityType: "Product",
            entityId: created.id,
            afterJson: created as unknown as object,
          },
        });
      });
      productCount++;
    }
  }

  console.log(`Listo. ${productCount} productos nuevos sembrados (los ya existentes no se duplican).`);

  await seedTanquesYCapacidades(areaIdByCode, superadmin);
  await seedStaff(superadmin);
}

type TanquesData = {
  tanques: { code: string; areaCode: string }[];
  capacidades: {
    areaCode: string;
    productoCodigo: string;
    tanqueCode: string;
    volumenUnitarioMl: number;
    volumenAValidarL: number;
    lotesProgramadosDia: number;
    cantidadTeoricaDia: number;
    horasEnvasado?: number;
    horasAnalisis?: number;
    observaciones?: string;
  }[];
};

/**
 * Datos reales tomados de "LEVANTAMIENTO DE LOTES PARA FM SEGÚN ÁREA" (Drive
 * de la planta): 9 tanques y 111 capacidades producto-tanque, cubriendo las
 * 5 áreas que tenían tabla de tanque/capacidad completa en esa planilla
 * (BFS PGV 321, VIDRIO —"PGV-PPV" en la planilla—, BFS PPV 312, HEMODIÁLISIS,
 * BFS PGV 305). Se dejó fuera una segunda tabla de esa misma planilla
 * ("VOLÚMENES DE PRODUCCIÓN POR PRESENTACIÓN") porque tiene un formato
 * distinto (series de tiempo, no capacidad por tanque) y no encaja en este
 * modelo. Cuando un producto+tanque tenía varias filas duplicadas (distintos
 * tamaños de lote), se tomó la primera como referencia.
 */
async function seedTanquesYCapacidades(
  areaIdByCode: Map<string, string>,
  superadmin: { id: string; username: string }
) {
  const raw = readFileSync(path.join(__dirname, "seed-data", "tanques.json"), "utf-8");
  const data: TanquesData = JSON.parse(raw);

  console.log(`Sembrando ${data.tanques.length} tanques...`);
  const tanqueIdByCode = new Map<string, string>();
  for (const t of data.tanques) {
    const areaId = areaIdByCode.get(t.areaCode);
    if (!areaId) {
      console.warn(`Área desconocida para tanque ${t.code}: ${t.areaCode}`);
      continue;
    }
    const saved = await prisma.tanque.upsert({
      where: { code: t.code },
      update: { areaId },
      create: { code: t.code, areaId },
    });
    tanqueIdByCode.set(t.code, saved.id);
  }

  console.log(`Sembrando ${data.capacidades.length} capacidades producto-tanque de referencia...`);
  let capacidadCount = 0;
  for (const c of data.capacidades) {
    const areaId = areaIdByCode.get(c.areaCode);
    const tanqueId = tanqueIdByCode.get(c.tanqueCode);
    if (!areaId || !tanqueId) continue;

    const product = await prisma.product.findFirst({
      where: { areaId, codigo: c.productoCodigo, validTo: null },
    });
    if (!product) {
      console.warn(`Producto ${c.productoCodigo} no encontrado en área ${c.areaCode}, se omite su capacidad`);
      continue;
    }

    const existing = await prisma.capacidadProductoTanque.findFirst({
      where: { productId: product.id, tanqueId, validTo: null },
    });
    if (existing) continue;

    await prisma.$transaction(async (tx) => {
      const created = await tx.capacidadProductoTanque.create({
        data: {
          groupId: crypto.randomUUID(),
          version: 1,
          productId: product.id,
          tanqueId,
          volumenUnitarioMl: c.volumenUnitarioMl,
          volumenAValidarL: c.volumenAValidarL,
          lotesProgramadosDia: c.lotesProgramadosDia,
          cantidadTeoricaDia: c.cantidadTeoricaDia,
          horasEnvasado: c.horasEnvasado ?? null,
          horasAnalisis: c.horasAnalisis ?? null,
          observaciones: c.observaciones ?? null,
          createdByUserId: superadmin.id,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: superadmin.id,
          actorUsername: superadmin.username,
          action: "CAPACIDAD_SEED",
          entityType: "CapacidadProductoTanque",
          entityId: created.id,
          afterJson: created as unknown as object,
        },
      });
    });
    capacidadCount++;
  }
  console.log(`Listo. ${capacidadCount} capacidades nuevas sembradas.`);
}

type StaffSeedData = {
  staff: {
    nombre: string;
    codigoEmpleado: string | null;
    departamento: string | null;
    rolBase: "Operador" | "Supervisor" | "Tecnologo";
  }[];
};

/**
 * Roster real de personal tomado de "horario para Edgar" (Drive de la
 * planta): 125 personas con nombre y código de empleado real. El
 * "departamento" de esa planilla (PROD, PAS, BFS-PGV, VIDRIO, AUT-PGV...) es
 * una taxonomía distinta de las 7 Áreas del sistema y no se mapea 1:1 sin
 * ambigüedad, así que se siembra sin áreas asignadas — se completan desde la
 * pantalla de Personal. rolBase se deja "Operador" para todos por la misma
 * razón (la planilla no tiene un cargo fijo por persona, cambia por turno);
 * corrígelo desde la UI para quienes correspondan a Supervisor/Tecnólogo.
 */
async function seedStaff(superadmin: { id: string; username: string }) {
  const raw = readFileSync(path.join(__dirname, "seed-data", "staff.json"), "utf-8");
  const data: StaffSeedData = JSON.parse(raw);

  console.log(`Sembrando ${data.staff.length} personas del roster real...`);
  let staffCount = 0;
  for (const s of data.staff) {
    const existing = await prisma.staff.findFirst({
      where: { nombre: s.nombre, codigoEmpleado: s.codigoEmpleado, validTo: null },
    });
    if (existing) continue;

    await prisma.$transaction(async (tx) => {
      const created = await tx.staff.create({
        data: {
          staffGroupId: crypto.randomUUID(),
          version: 1,
          nombre: s.nombre,
          codigoEmpleado: s.codigoEmpleado,
          rolBase: s.rolBase,
          areaIds: [],
          createdByUserId: superadmin.id,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: superadmin.id,
          actorUsername: superadmin.username,
          action: "STAFF_SEED",
          entityType: "Staff",
          entityId: created.id,
          afterJson: { ...created, departamentoOriginal: s.departamento } as unknown as object,
        },
      });
    });
    staffCount++;
  }
  console.log(`Listo. ${staffCount} personas nuevas sembradas (las ya existentes no se duplican).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

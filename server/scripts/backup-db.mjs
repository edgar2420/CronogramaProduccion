#!/usr/bin/env node
/**
 * Respaldo de la base de datos.
 *
 *   node scripts/backup-db.mjs [--dir <carpeta>] [--retencion <dias>]
 *
 * Genera un dump comprimido en formato custom de pg_dump (`-Fc`), que es el que
 * acepta `pg_restore` para restaurar selectivamente, más un `.sha256` para poder
 * demostrar que el archivo no se alteró (integridad de datos, ALCOA+).
 *
 * Corre `pg_dump` dentro del contenedor de Postgres, así no hace falta tener las
 * herramientas de cliente instaladas en la máquina.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..");

function arg(nombre, porDefecto) {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : porDefecto;
}

const destino = path.resolve(arg("dir", process.env.BACKUP_DIR ?? path.join(raiz, "backups")));
const retencionDias = Number(arg("retencion", process.env.BACKUP_RETENTION_DAYS ?? "30"));
const servicio = process.env.BACKUP_PG_SERVICE ?? "postgres";
const usuario = process.env.POSTGRES_USER ?? "cronograma_app";
const baseDatos = process.env.POSTGRES_DB ?? "cronograma_produccion";

mkdirSync(destino, { recursive: true });

// Marca de tiempo UTC, para que los respaldos ordenen igual en cualquier huso.
const sello = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const archivo = path.join(destino, `cronograma-${sello}.dump`);

console.log(`Respaldando ${baseDatos} → ${archivo}`);

const dump = spawnSync(
  "docker",
  ["compose", "exec", "-T", servicio, "pg_dump", "-U", usuario, "-d", baseDatos, "-Fc", "--no-owner"],
  { cwd: raiz, maxBuffer: 1024 * 1024 * 1024 }
);

if (dump.status !== 0) {
  console.error("pg_dump falló:", dump.stderr?.toString() || dump.error?.message);
  process.exit(1);
}
if (!dump.stdout?.length) {
  console.error("pg_dump no devolvió datos; no se escribe un respaldo vacío.");
  process.exit(1);
}

writeFileSync(archivo, dump.stdout);
const sha = createHash("sha256").update(dump.stdout).digest("hex");
writeFileSync(`${archivo}.sha256`, `${sha}  ${path.basename(archivo)}\n`);

console.log(`✔ ${(dump.stdout.length / 1024 / 1024).toFixed(2)} MB · sha256 ${sha.slice(0, 16)}…`);

// Verificación inmediata: un respaldo que pg_restore no puede leer no es un
// respaldo. Listar su contenido detecta un archivo truncado o corrupto ahora y
// no el día que haya que restaurar.
const verificacion = spawnSync("docker", ["compose", "exec", "-T", servicio, "pg_restore", "--list"], {
  cwd: raiz,
  input: dump.stdout,
  maxBuffer: 1024 * 1024 * 256,
});
if (verificacion.status !== 0) {
  console.error("El respaldo no es legible por pg_restore, se descarta:", verificacion.stderr?.toString());
  unlinkSync(archivo);
  unlinkSync(`${archivo}.sha256`);
  process.exit(1);
}
console.log("✔ Verificado: pg_restore puede leer el archivo.");

// Retención
if (Number.isFinite(retencionDias) && retencionDias > 0) {
  const limite = Date.now() - retencionDias * 24 * 60 * 60 * 1000;
  let borrados = 0;
  for (const nombre of readdirSync(destino)) {
    if (!nombre.startsWith("cronograma-") || !nombre.endsWith(".dump")) continue;
    const ruta = path.join(destino, nombre);
    if (statSync(ruta).mtimeMs >= limite) continue;
    unlinkSync(ruta);
    try {
      unlinkSync(`${ruta}.sha256`);
    } catch {
      /* el .sha256 puede no existir en respaldos viejos */
    }
    borrados++;
  }
  if (borrados) console.log(`Retención: ${borrados} respaldo(s) de más de ${retencionDias} días eliminados.`);
}

// Registro append-only del respaldo, para la evidencia de continuidad.
const bitacora = path.join(destino, "bitacora.log");
const linea = `${new Date().toISOString()}\t${path.basename(archivo)}\t${dump.stdout.length}\t${sha}\n`;
writeFileSync(bitacora, linea, { flag: "a" });

// Aviso si el respaldo previo ya no está: puede ser retención o borrado indebido.
const existentes = readdirSync(destino).filter((f) => f.endsWith(".dump"));
console.log(`Respaldos disponibles: ${existentes.length}`);

// Evita que un typo en el nombre pase inadvertido al restaurar.
if (readFileSync(`${archivo}.sha256`, "utf-8").trim().split(/\s+/)[0] !== sha) {
  console.error("El .sha256 escrito no coincide con el calculado.");
  process.exit(1);
}

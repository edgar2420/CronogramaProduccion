#!/usr/bin/env node
/**
 * Restauración desde un respaldo de `backup-db.mjs`.
 *
 *   node scripts/restore-db.mjs --archivo backups/cronograma-....dump [--confirmar]
 *   node scripts/restore-db.mjs --archivo <...> --ensayo   (restaura en una BD aparte)
 *
 * Sin `--confirmar` no toca nada: muestra qué haría. Restaurar PISA la base de
 * datos actual, así que el paso deliberado es a propósito.
 *
 * `--ensayo` restaura sobre una base de datos temporal en vez de la productiva:
 * es el simulacro de recuperación que hay que poder mostrar en una auditoría sin
 * arriesgar los datos vigentes.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..");

function arg(nombre, porDefecto) {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : porDefecto;
}
const bandera = (nombre) => process.argv.includes(`--${nombre}`);

const archivo = arg("archivo");
if (!archivo) {
  console.error("Falta --archivo <ruta al .dump>");
  process.exit(1);
}
const ruta = path.resolve(raiz, archivo);
if (!existsSync(ruta)) {
  console.error(`No existe ${ruta}`);
  process.exit(1);
}

const servicio = process.env.BACKUP_PG_SERVICE ?? "postgres";
const usuario = process.env.POSTGRES_USER ?? "cronograma_app";
const baseProductiva = process.env.POSTGRES_DB ?? "cronograma_produccion";
const ensayo = bandera("ensayo");
const destino = ensayo ? `${baseProductiva}_ensayo` : baseProductiva;

const contenido = readFileSync(ruta);

// Integridad antes que nada: restaurar un dump alterado sería peor que no
// restaurar. Si hay .sha256, tiene que coincidir.
const rutaSha = `${ruta}.sha256`;
if (existsSync(rutaSha)) {
  const esperado = readFileSync(rutaSha, "utf-8").trim().split(/\s+/)[0];
  const real = createHash("sha256").update(contenido).digest("hex");
  if (esperado !== real) {
    console.error(`El respaldo no coincide con su sha256.\n  esperado ${esperado}\n  real     ${real}`);
    process.exit(1);
  }
  console.log("✔ sha256 verificado.");
} else {
  console.warn("⚠ El respaldo no tiene .sha256: no se puede probar su integridad.");
}

function pg(args, input) {
  return spawnSync("docker", ["compose", "exec", "-T", servicio, ...args], {
    cwd: raiz,
    input,
    maxBuffer: 1024 * 1024 * 1024,
  });
}

console.log(`\nRestauraría:\n  desde : ${ruta}\n  hacia : ${destino}${ensayo ? "  (ensayo)" : "  (PRODUCTIVA)"}`);

if (!bandera("confirmar")) {
  console.log("\nEsto reemplaza el contenido de esa base de datos.");
  console.log("Volvé a correrlo agregando --confirmar para ejecutarlo de verdad.");
  process.exit(0);
}

if (ensayo) {
  pg(["dropdb", "-U", usuario, "--if-exists", destino]);
  const creada = pg(["createdb", "-U", usuario, destino]);
  if (creada.status !== 0) {
    console.error("No se pudo crear la base de ensayo:", creada.stderr?.toString());
    process.exit(1);
  }
}

// --clean --if-exists deja la base en el estado del dump aunque tenga objetos
// previos; sin eso la restauración falla a medias y queda un estado mezclado.
const restore = pg(
  ["pg_restore", "-U", usuario, "-d", destino, "--clean", "--if-exists", "--no-owner", "--single-transaction"],
  contenido
);

if (restore.status !== 0) {
  console.error("pg_restore falló:", restore.stderr?.toString());
  process.exit(1);
}

console.log(`✔ Restaurado en ${destino}.`);

// Conteos para dejar constancia de qué se recuperó.
const conteo = pg([
  "psql",
  "-U",
  usuario,
  "-d",
  destino,
  "-c",
  "SELECT (SELECT count(*) FROM ordenes) AS ordenes, (SELECT count(*) FROM products) AS productos, (SELECT count(*) FROM audit_log) AS audit_rows;",
]);
console.log(conteo.stdout?.toString());

// `--clean` recrea las tablas, y con ellas se van las reglas que hacen
// append-only al audit_log. Se reaplican siempre, no como recordatorio.
const proteger = spawnSync(process.execPath, [path.join(__dirname, "proteger-audit.mjs"), "--db", destino], {
  cwd: raiz,
  stdio: "inherit",
});
if (proteger.status !== 0) {
  console.error("La restauración terminó pero el audit_log quedó sin proteger. Corregilo antes de usar el sistema.");
  process.exit(1);
}

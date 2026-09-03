#!/usr/bin/env node
/**
 * Aplica las reglas que hacen `audit_log` append-only
 * (`prisma/sql/audit_log_immutable.sql`) y comprueba que quedaron activas.
 *
 *   node scripts/proteger-audit.mjs [--db <base>]
 *
 * Hay que correrlo después de cada `prisma migrate` y de cada restauración: son
 * reglas a nivel de tabla, y si la tabla se recrea se van con ella. Es lo que
 * impide editar el audit trail desde la propia base de datos (21 CFR Part 11).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..");

const i = process.argv.indexOf("--db");
const baseDatos = i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : (process.env.POSTGRES_DB ?? "cronograma_produccion");
const servicio = process.env.BACKUP_PG_SERVICE ?? "postgres";
const usuario = process.env.POSTGRES_USER ?? "cronograma_app";

function psql(sql) {
  return spawnSync("docker", ["compose", "exec", "-T", servicio, "psql", "-U", usuario, "-d", baseDatos], {
    cwd: raiz,
    input: sql,
    maxBuffer: 1024 * 1024 * 64,
  });
}

const aplicar = psql(readFileSync(path.join(raiz, "prisma", "sql", "audit_log_immutable.sql"), "utf-8"));
if (aplicar.status !== 0) {
  console.error("No se pudieron aplicar las reglas:", aplicar.stderr?.toString());
  process.exit(1);
}

// No basta con que el script corra sin error: hay que ver las reglas puestas.
const verificar = psql(
  "SELECT rulename FROM pg_rules WHERE tablename = 'audit_log' ORDER BY rulename;"
);
const salida = verificar.stdout?.toString() ?? "";
const faltantes = ["audit_log_no_update", "audit_log_no_delete"].filter((r) => !salida.includes(r));

if (faltantes.length > 0) {
  console.error(`Faltan reglas en audit_log: ${faltantes.join(", ")}`);
  console.error(salida);
  process.exit(1);
}

console.log(`✔ audit_log protegido en ${baseDatos} (UPDATE y DELETE no tienen efecto).`);

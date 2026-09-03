#!/usr/bin/env node
/**
 * Genera un certificado autofirmado para **desarrollo**, para poder probar el
 * camino HTTPS del servidor sin depender de una CA.
 *
 *   node scripts/generar-certificado-dev.mjs
 *   # luego en .env: TLS_ENABLED=true, TLS_KEY_PATH=certs/dev-key.pem, TLS_CERT_PATH=certs/dev-cert.pem
 *
 * NO sirve para producción: el navegador lo va a rechazar y no acredita nada.
 * En producción usá un certificado emitido por una CA (Let's Encrypt o la CA
 * interna de la planta) y renovalo antes de que venza.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..");
const destino = path.join(raiz, "certs");

mkdirSync(destino, { recursive: true });
const key = path.join(destino, "dev-key.pem");
const cert = path.join(destino, "dev-cert.pem");

if (existsSync(key) && existsSync(cert) && !process.argv.includes("--forzar")) {
  console.log(`Ya existen ${key} y ${cert}. Usá --forzar para regenerarlos.`);
  process.exit(0);
}

// openssl viene con Git para Windows; si no está, se usa el del contenedor.
const openssl = spawnSync(
  "openssl",
  [
    "req", "-x509", "-newkey", "rsa:2048", "-nodes",
    "-keyout", key, "-out", cert,
    "-days", "365",
    "-subj", "/CN=localhost/O=Laboratorios ABD (desarrollo)",
    "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
  ],
  { stdio: "inherit" }
);

if (openssl.status !== 0) {
  console.error("No se pudo generar el certificado. ¿Está openssl en el PATH?");
  process.exit(1);
}

console.log(`\n✔ Certificado de desarrollo generado:\n  ${key}\n  ${cert}`);
console.log("\nAgregá a server/.env:");
console.log("  TLS_ENABLED=true");
console.log("  TLS_KEY_PATH=certs/dev-key.pem");
console.log("  TLS_CERT_PATH=certs/dev-cert.pem");

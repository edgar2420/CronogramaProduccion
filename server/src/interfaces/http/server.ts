import http from "node:http";
import https from "node:https";
import { readFileSync } from "node:fs";
import { env } from "../../config/env.js";
import { prisma } from "../../infrastructure/persistence/prisma/prismaClient.js";
import { createApp } from "./app.js";

const app = createApp();

/**
 * Dos formas válidas de servir HTTPS (env.ts rechaza producción sin ninguna):
 *  - TLS_ENABLED: este proceso termina TLS con sus propios certificados.
 *  - TLS_TERMINATED_BY_PROXY: un proxy/balanceador ya lo hizo y reenvía por HTTP
 *    en una red interna; app.ts exige entonces X-Forwarded-Proto=https.
 */
function crearServidor(): http.Server | https.Server {
  if (!env.TLS_ENABLED) return http.createServer(app);

  return https.createServer(
    {
      key: readFileSync(env.TLS_KEY_PATH!),
      cert: readFileSync(env.TLS_CERT_PATH!),
      ...(env.TLS_CA_PATH ? { ca: readFileSync(env.TLS_CA_PATH) } : {}),
      // TLS 1.2 es el piso; por debajo hay suites rotas (POODLE, BEAST).
      minVersion: "TLSv1.2",
      honorCipherOrder: true,
    },
    app
  );
}

const server = crearServidor();

server.listen(env.PORT, () => {
  const esquema = env.TLS_ENABLED ? "https" : "http";
  console.log(`API escuchando en ${esquema}://localhost:${env.PORT} (${env.NODE_ENV})`);
  if (!env.TLS_ENABLED && env.TLS_TERMINATED_BY_PROXY) {
    console.log("TLS lo termina el proxy: se rechaza toda petición que no llegue como HTTPS.");
  }
});

/**
 * Apagado ordenado: sin esto un redeploy corta peticiones a medio commit y deja
 * conexiones de Prisma colgadas.
 */
let apagando = false;
for (const senal of ["SIGTERM", "SIGINT"] as const) {
  process.on(senal, () => {
    if (apagando) return;
    apagando = true;
    console.log(`${senal} recibida, cerrando…`);

    const forzar = setTimeout(() => {
      console.error("El cierre ordenado no terminó a tiempo, se fuerza la salida.");
      process.exit(1);
    }, 10_000);
    forzar.unref();

    server.close(async () => {
      await prisma.$disconnect();
      console.log("Cerrado.");
      process.exit(0);
    });
  });
}

import { env } from "../../config/env.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`API escuchando en puerto ${env.PORT} (${env.NODE_ENV})`);
  if (env.NODE_ENV !== "production") {
    console.log("Nota: en producción, este servidor debe correr detrás de un proxy/balanceador con TLS (HTTPS).");
  }
});

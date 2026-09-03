import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatorio"),
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN es obligatorio"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET debe tener al menos 32 caracteres"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET debe tener al menos 32 caracteres"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  LOGIN_MAX_FAILED_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),

  // TLS. En producción el tráfico va cifrado sí o sí: o el proceso termina TLS
  // (TLS_ENABLED=true + certificados) o corre detrás de un proxy que ya lo hizo
  // (TLS_TERMINATED_BY_PROXY=true). Sin ninguna de las dos, el arranque falla.
  TLS_ENABLED: z.coerce.boolean().default(false),
  TLS_KEY_PATH: z.string().optional(),
  TLS_CERT_PATH: z.string().optional(),
  /** Cadena de CA intermedia, si el emisor la requiere. */
  TLS_CA_PATH: z.string().optional(),
  TLS_TERMINATED_BY_PROXY: z.coerce.boolean().default(false),
  /** Saltos de proxy de confianza para leer X-Forwarded-*. */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  /** HSTS: 2 años, el mínimo que exige la preload list. */
  HSTS_MAX_AGE_SECONDS: z.coerce.number().int().nonnegative().default(63_072_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variables de entorno inválidas o faltantes:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Configuración de entorno inválida. Revisa server/.env contra server/.env.example");
}

const config = parsed.data;

if (config.TLS_ENABLED && (!config.TLS_KEY_PATH || !config.TLS_CERT_PATH)) {
  throw new Error("TLS_ENABLED=true requiere TLS_KEY_PATH y TLS_CERT_PATH");
}

if (config.NODE_ENV === "production" && !config.TLS_ENABLED && !config.TLS_TERMINATED_BY_PROXY) {
  throw new Error(
    "En producción el tráfico debe ir por HTTPS: activá TLS_ENABLED con certificados " +
      "o declará TLS_TERMINATED_BY_PROXY=true si un proxy ya termina el TLS."
  );
}

if (config.NODE_ENV === "production" && config.CORS_ORIGIN.split(",").some((o) => o.trim() === "*")) {
  throw new Error("CORS_ORIGIN no puede ser '*' en producción: el API usa cookies de sesión.");
}

export const env = {
  ...config,
  /** Orígenes permitidos por CORS, ya separados. */
  corsOrigins: config.CORS_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  /** La cookie de refresh solo viaja por HTTPS cuando hay HTTPS. */
  cookieSecure: config.TLS_ENABLED || config.TLS_TERMINATED_BY_PROXY || config.NODE_ENV === "production",
};

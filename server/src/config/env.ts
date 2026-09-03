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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variables de entorno inválidas o faltantes:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Configuración de entorno inválida. Revisa server/.env contra server/.env.example");
}

export const env = parsed.data;

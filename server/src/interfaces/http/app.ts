import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { areasRouter } from "./routes/areas.routes.js";
import { productsRouter } from "./routes/products.routes.js";
import { staffRouter } from "./routes/staff.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { tanquesRouter } from "./routes/tanques.routes.js";
import { capacidadRouter } from "./routes/capacidad.routes.js";
import { semanasRouter } from "./routes/semanas.routes.js";
import { ordenesRouter } from "./routes/ordenes.routes.js";
import { asignacionesRouter } from "./routes/asignaciones.routes.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { globalRateLimiter } from "./middlewares/rateLimiter.middleware.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
  // Sin esto, ?areaId=a&areaId=b llega como array y burla validaciones que
  // esperan un string (contaminación de parámetros, OWASP A03).
  app.set("query parser", "simple");

  app.use(
    helmet({
      // El API solo devuelve JSON: nada de scripts, estilos ni frames.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      hsts: {
        maxAge: env.HSTS_MAX_AGE_SECONDS,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: "no-referrer" },
      crossOriginResourcePolicy: { policy: "same-site" },
    })
  );

  // Fuerza HTTPS. Con TLS propio la conexión ya llegó cifrada; detrás de un
  // proxy hay que mirar X-Forwarded-Proto (por eso el trust proxy de arriba).
  if (env.TLS_TERMINATED_BY_PROXY) {
    app.use((req, res, next) => {
      if (req.secure) return next();
      // Una API con cookies no debe redirigir credenciales por texto plano.
      res.status(403).json({ error: "HTTPS_REQUERIDO", message: "Este servicio solo acepta HTTPS." });
    });
  }

  // Allowlist explícita: con credentials:true el navegador exige un origen
  // concreto, y devolver el Origin recibido sin validarlo lo abriría a todos.
  // Se rechaza acá y no dentro de cors() para responder un 403 claro en vez de
  // que el error del callback caiga en el manejador genérico como un 500.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && !env.corsOrigins.includes(origin)) {
      res.status(403).json({ error: "ORIGEN_NO_PERMITIDO", message: "Origen no autorizado." });
      return;
    }
    next();
  });

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
      maxAge: 600,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(globalRateLimiter);

  // Ninguna respuesta del API es cacheable: llevan datos de lote y de personal.
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  app.use((req, _res, next) => {
    req.requestId = randomUUID();
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/areas", areasRouter);
  app.use("/api/v1/products", productsRouter);
  app.use("/api/v1/staff", staffRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/tanques", tanquesRouter);
  app.use("/api/v1/productos", capacidadRouter);
  app.use("/api/v1/semanas", semanasRouter);
  app.use("/api/v1/ordenes", ordenesRouter);
  app.use("/api/v1/asignaciones", asignacionesRouter);

  app.use(errorHandler);

  return app;
}

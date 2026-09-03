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
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(globalRateLimiter);

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

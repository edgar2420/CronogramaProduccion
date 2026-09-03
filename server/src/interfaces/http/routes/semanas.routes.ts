import { Router } from "express";
import * as semanasController from "../controllers/semanas.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const semanasRouter = Router();
semanasRouter.use(authMiddleware);

semanasRouter.get("/", asyncHandler(semanasController.listSemanas));
semanasRouter.post("/", requireRole("admin", "superadmin"), asyncHandler(semanasController.ensureSemana));
semanasRouter.post(
  "/:id/publicar",
  requireRole("admin", "superadmin"),
  asyncHandler(semanasController.publishSemana)
);
semanasRouter.post(
  "/:id/cerrar",
  requireRole("admin", "superadmin"),
  asyncHandler(semanasController.closeSemana)
);

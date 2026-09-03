import { Router } from "express";
import * as asignacionesController from "../controllers/asignaciones.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const asignacionesRouter = Router();
asignacionesRouter.use(authMiddleware);

asignacionesRouter.delete(
  "/:id",
  requireRole("admin", "superadmin"),
  asyncHandler(asignacionesController.revokeAssignment)
);

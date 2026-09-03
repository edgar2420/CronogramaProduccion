import { Router } from "express";
import * as ordenesController from "../controllers/ordenes.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const ordenesRouter = Router();
ordenesRouter.use(authMiddleware);

ordenesRouter.get("/", asyncHandler(ordenesController.listOrdenes));
ordenesRouter.post("/", requireRole("admin", "superadmin"), asyncHandler(ordenesController.createOrden));
ordenesRouter.put("/:id", requireRole("admin", "superadmin"), asyncHandler(ordenesController.updateOrden));
ordenesRouter.delete(
  "/:id",
  requireRole("admin", "superadmin"),
  asyncHandler(ordenesController.deleteOrden)
);
ordenesRouter.post(
  "/:id/registrar-real",
  requireRole("admin", "superadmin"),
  asyncHandler(ordenesController.registerReal)
);
ordenesRouter.post(
  "/:id/cancelar",
  requireRole("admin", "superadmin"),
  asyncHandler(ordenesController.cancelOrden)
);
ordenesRouter.get("/:id/asignaciones", asyncHandler(ordenesController.listAsignaciones));
ordenesRouter.post(
  "/:id/asignaciones",
  requireRole("admin", "superadmin"),
  asyncHandler(ordenesController.assignStaff)
);

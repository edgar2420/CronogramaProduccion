import { Router } from "express";
import * as capacidadController from "../controllers/capacidad.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../asyncHandler.js";

/** Montado en /api/v1/productos — ver container.capacidad. */
export const capacidadRouter = Router();
capacidadRouter.use(authMiddleware);

capacidadRouter.get("/:productId/capacidad", asyncHandler(capacidadController.getCapacidadByProducto));
capacidadRouter.post(
  "/:productId/capacidad",
  requireRole("admin", "superadmin"),
  asyncHandler(capacidadController.setCapacidad)
);

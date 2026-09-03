import { Router } from "express";
import * as areasController from "../controllers/areas.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const areasRouter = Router();

areasRouter.use(authMiddleware);

areasRouter.get("/", asyncHandler(areasController.listAreas));
areasRouter.post("/", requireRole("admin", "superadmin"), asyncHandler(areasController.createArea));
areasRouter.put("/:id", requireRole("admin", "superadmin"), asyncHandler(areasController.updateArea));
areasRouter.patch(
  "/:id/active",
  requireRole("admin", "superadmin"),
  asyncHandler(areasController.setAreaActive)
);

import { Router } from "express";
import * as tanquesController from "../controllers/tanques.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const tanquesRouter = Router();
tanquesRouter.use(authMiddleware);

tanquesRouter.get("/", asyncHandler(tanquesController.listTanques));
tanquesRouter.post("/", requireRole("admin", "superadmin"), asyncHandler(tanquesController.createTanque));

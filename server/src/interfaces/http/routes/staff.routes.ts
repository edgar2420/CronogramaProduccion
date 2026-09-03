import { Router } from "express";
import * as staffController from "../controllers/staff.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const staffRouter = Router();
staffRouter.use(authMiddleware);

staffRouter.get("/", asyncHandler(staffController.listStaff));
staffRouter.post("/", requireRole("admin", "superadmin"), asyncHandler(staffController.createStaff));
staffRouter.put("/:id", requireRole("admin", "superadmin"), asyncHandler(staffController.updateStaff));
staffRouter.patch(
  "/:id/deactivate",
  requireRole("admin", "superadmin"),
  asyncHandler(staffController.deactivateStaff)
);
staffRouter.patch(
  "/:id/skills",
  requireRole("admin", "superadmin"),
  asyncHandler(staffController.updateStaffSkills)
);

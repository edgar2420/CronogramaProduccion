import { Router } from "express";
import * as usersController from "../controllers/users.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../asyncHandler.js";

/** Gestión de usuarios: solo superadmin, igual que la pantalla admin/users del frontend. */
export const usersRouter = Router();
usersRouter.use(authMiddleware, requireRole("superadmin"));

usersRouter.get("/", asyncHandler(usersController.listUsers));
usersRouter.post("/", asyncHandler(usersController.createUser));
usersRouter.put("/:id", asyncHandler(usersController.updateUser));

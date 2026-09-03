import { Router } from "express";
import * as productsController from "../controllers/products.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const productsRouter = Router();

productsRouter.use(authMiddleware);

productsRouter.get("/", asyncHandler(productsController.listProducts));
productsRouter.get("/:id", asyncHandler(productsController.getProduct));
productsRouter.get("/:id/history", asyncHandler(productsController.getProductHistory));
productsRouter.post("/", requireRole("admin", "superadmin"), asyncHandler(productsController.createProduct));
productsRouter.put(
  "/:id",
  requireRole("admin", "superadmin"),
  asyncHandler(productsController.updateProduct)
);
productsRouter.patch(
  "/:id/deactivate",
  requireRole("admin", "superadmin"),
  asyncHandler(productsController.deactivateProduct)
);

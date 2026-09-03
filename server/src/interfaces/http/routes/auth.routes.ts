import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { loginRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, asyncHandler(authController.login));
authRouter.post("/refresh", loginRateLimiter, asyncHandler(authController.refresh));
authRouter.post("/logout", authMiddleware, asyncHandler(authController.logout));
authRouter.get("/me", authMiddleware, asyncHandler(authController.me));

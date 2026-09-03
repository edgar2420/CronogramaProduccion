import type { NextFunction, Request, Response } from "express";
import { container } from "../../../config/container.js";
import type { Role } from "../../../domain/user/User.entity.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { userId: string; username: string; role: Role };
      requestId?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Falta token de autenticación" });
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = container.tokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Token inválido o expirado" });
  }
}

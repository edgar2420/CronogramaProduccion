import type { NextFunction, Request, Response } from "express";
import type { Role } from "../../../domain/user/User.entity.js";

/** RBAC autoritativo de servidor — espejo de src/auth/RoleGuard.tsx en el frontend, pero real. */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "No autenticado" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "FORBIDDEN", message: "No tienes permiso para esta acción" });
      return;
    }
    next();
  };
}

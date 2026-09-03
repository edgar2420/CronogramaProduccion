import type { Request, Response } from "express";
import { container } from "../../../config/container.js";
import type { ActorContext } from "../../../application/shared/ActorContext.js";
import { requireParam } from "../requireParam.js";

function actorFrom(req: Request): ActorContext {
  const user = req.user!;
  return {
    userId: user.userId,
    username: user.username,
    role: user.role,
    ipAddress: req.ip ?? null,
    requestId: req.requestId ?? null,
  };
}

export async function revokeAssignment(req: Request, res: Response) {
  const asignacion = await container.asignaciones.revoke.execute(requireParam(req, "id"), actorFrom(req));
  res.json(asignacion);
}

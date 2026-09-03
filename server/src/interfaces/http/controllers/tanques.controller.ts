import type { Request, Response } from "express";
import { container } from "../../../config/container.js";
import { createTanqueDto, listTanquesQueryDto } from "../dto/tanque.dto.js";
import type { ActorContext } from "../../../application/shared/ActorContext.js";

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

export async function listTanques(req: Request, res: Response) {
  const query = listTanquesQueryDto.parse(req.query);
  const items = await container.tanques.list.execute(query.areaId);
  res.json({ items });
}

export async function createTanque(req: Request, res: Response) {
  const input = createTanqueDto.parse(req.body);
  const tanque = await container.tanques.create.execute(input, actorFrom(req));
  res.status(201).json(tanque);
}

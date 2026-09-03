import type { Request, Response } from "express";
import { container } from "../../../config/container.js";
import { createUserDto, updateUserDto } from "../dto/user.dto.js";
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

export async function listUsers(_req: Request, res: Response) {
  const items = await container.users.list.execute();
  res.json({ items });
}

export async function createUser(req: Request, res: Response) {
  const input = createUserDto.parse(req.body);
  const user = await container.users.create.execute(input, actorFrom(req));
  res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response) {
  const input = updateUserDto.parse(req.body);
  const user = await container.users.update.execute(requireParam(req, "id"), input, actorFrom(req));
  res.json(user);
}

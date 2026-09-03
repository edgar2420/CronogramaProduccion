import type { Request, Response } from "express";
import { container } from "../../../config/container.js";
import { createAreaDto, setAreaActiveDto, updateAreaDto } from "../dto/area.dto.js";
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

export async function listAreas(_req: Request, res: Response) {
  const areas = await container.areas.list.execute();
  res.json({ items: areas });
}

export async function createArea(req: Request, res: Response) {
  const input = createAreaDto.parse(req.body);
  const area = await container.areas.create.execute(input, actorFrom(req));
  res.status(201).json(area);
}

export async function updateArea(req: Request, res: Response) {
  const input = updateAreaDto.parse(req.body);
  const area = await container.areas.update.execute(requireParam(req, "id"), input, actorFrom(req));
  res.json(area);
}

export async function setAreaActive(req: Request, res: Response) {
  const input = setAreaActiveDto.parse(req.body);
  const area = await container.areas.setActive.execute(
    requireParam(req, "id"),
    input.active,
    actorFrom(req)
  );
  res.json(area);
}

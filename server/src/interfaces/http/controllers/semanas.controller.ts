import type { Request, Response } from "express";
import { container } from "../../../config/container.js";
import { ensureSemanaDto, listSemanasQueryDto } from "../dto/semana.dto.js";
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

export async function listSemanas(req: Request, res: Response) {
  const query = listSemanasQueryDto.parse(req.query);
  const items = await container.semanas.list.execute(query.areaId);
  res.json({ items });
}

export async function ensureSemana(req: Request, res: Response) {
  const input = ensureSemanaDto.parse(req.body);
  const semana = await container.semanas.ensure.execute({
    areaId: input.areaId,
    fechaInicio: new Date(input.fechaInicio),
    fechaFin: new Date(input.fechaFin),
  });
  res.status(200).json(semana);
}

export async function publishSemana(req: Request, res: Response) {
  const semana = await container.semanas.publish.execute(requireParam(req, "id"), actorFrom(req));
  res.json(semana);
}

export async function closeSemana(req: Request, res: Response) {
  const semana = await container.semanas.close.execute(requireParam(req, "id"), actorFrom(req));
  res.json(semana);
}

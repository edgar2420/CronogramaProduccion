import type { Request, Response } from "express";
import { container } from "../../../config/container.js";
import { setCapacidadDto } from "../dto/capacidad.dto.js";
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

export async function getCapacidadByProducto(req: Request, res: Response) {
  const items = await container.capacidad.getByProducto.execute(requireParam(req, "productId"));
  res.json({ items });
}

export async function setCapacidad(req: Request, res: Response) {
  const input = setCapacidadDto.parse(req.body);
  const capacidad = await container.capacidad.set.execute(
    { productId: requireParam(req, "productId"), ...input },
    actorFrom(req)
  );
  res.status(201).json(capacidad);
}

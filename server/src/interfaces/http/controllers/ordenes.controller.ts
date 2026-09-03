import type { Request, Response } from "express";
import { container } from "../../../config/container.js";
import {
  cancelOrdenDto,
  createOrdenDto,
  listOrdenesQueryDto,
  registerRealDto,
  updateOrdenDto,
} from "../dto/orden.dto.js";
import { assignStaffDto } from "../dto/asignacion.dto.js";
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

export async function listOrdenes(req: Request, res: Response) {
  const query = listOrdenesQueryDto.parse(req.query);
  const items = await container.ordenes.listBySemana.execute(query.semanaId);
  res.json({ items });
}

export async function createOrden(req: Request, res: Response) {
  const input = createOrdenDto.parse(req.body);
  const orden = await container.ordenes.create.execute(input, actorFrom(req));
  res.status(201).json(orden);
}

export async function updateOrden(req: Request, res: Response) {
  const input = updateOrdenDto.parse(req.body);
  const orden = await container.ordenes.update.execute(requireParam(req, "id"), input, actorFrom(req));
  res.json(orden);
}

export async function deleteOrden(req: Request, res: Response) {
  const orden = await container.ordenes.remove.execute(requireParam(req, "id"), actorFrom(req));
  res.json(orden);
}

export async function registerReal(req: Request, res: Response) {
  const input = registerRealDto.parse(req.body);
  const orden = await container.ordenes.registerReal.execute(requireParam(req, "id"), input, actorFrom(req));
  res.json(orden);
}

export async function cancelOrden(req: Request, res: Response) {
  const input = cancelOrdenDto.parse(req.body);
  const orden = await container.ordenes.cancel.execute(
    requireParam(req, "id"),
    input.motivoCancelacion,
    actorFrom(req)
  );
  res.json(orden);
}

export async function listAsignaciones(req: Request, res: Response) {
  const items = await container.asignaciones.listByOrden.execute(requireParam(req, "id"));
  res.json({ items });
}

export async function assignStaff(req: Request, res: Response) {
  const input = assignStaffDto.parse(req.body);
  const asignacion = await container.asignaciones.assign.execute(
    { ordenId: requireParam(req, "id"), ...input },
    actorFrom(req)
  );
  res.status(201).json(asignacion);
}

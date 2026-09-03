import type { Request, Response } from "express";
import { container } from "../../../config/container.js";
import {
  createStaffDto,
  deactivateStaffDto,
  listStaffQueryDto,
  updateStaffDto,
  updateStaffSkillsDto,
} from "../dto/staff.dto.js";
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

export async function listStaff(req: Request, res: Response) {
  const query = listStaffQueryDto.parse(req.query);
  const items = await container.staff.list.execute(query);
  res.json({ items });
}

export async function createStaff(req: Request, res: Response) {
  const input = createStaffDto.parse(req.body);
  const staff = await container.staff.create.execute(input, actorFrom(req));
  res.status(201).json(staff);
}

export async function updateStaff(req: Request, res: Response) {
  const input = updateStaffDto.parse(req.body);
  const staff = await container.staff.update.execute(requireParam(req, "id"), input, actorFrom(req));
  res.json(staff);
}

export async function updateStaffSkills(req: Request, res: Response) {
  const input = updateStaffSkillsDto.parse(req.body);
  const staff = await container.staff.updateSkills.execute(
    requireParam(req, "id"),
    input.skills,
    actorFrom(req)
  );
  res.json(staff);
}

export async function deactivateStaff(req: Request, res: Response) {
  const input = deactivateStaffDto.parse(req.body);
  const staff = await container.staff.deactivate.execute(
    requireParam(req, "id"),
    input.changeReason,
    actorFrom(req)
  );
  res.json(staff);
}

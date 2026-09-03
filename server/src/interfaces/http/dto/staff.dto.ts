import { z } from "zod";

const rolBaseEnum = z.enum(["Operador", "Supervisor", "Tecnologo"]);

export const createStaffDto = z.object({
  nombre: z.string().trim().min(1).max(200),
  codigoEmpleado: z.string().trim().max(50).nullish(),
  rolBase: rolBaseEnum,
  areaIds: z.array(z.string().uuid()).default([]),
});
export type CreateStaffDto = z.infer<typeof createStaffDto>;

export const updateStaffDto = z.object({
  nombre: z.string().trim().min(1).max(200).optional(),
  codigoEmpleado: z.string().trim().max(50).nullish(),
  rolBase: rolBaseEnum.optional(),
  areaIds: z.array(z.string().uuid()).optional(),
  changeReason: z.string().trim().min(3).max(500),
});
export type UpdateStaffDto = z.infer<typeof updateStaffDto>;

export const deactivateStaffDto = z.object({
  changeReason: z.string().trim().min(3).max(500),
});

const skillLevelEnum = z.enum(["ok", "reforzar", "capacitar"]);
export const updateStaffSkillsDto = z.object({
  skills: z.record(z.string(), skillLevelEnum),
});
export type UpdateStaffSkillsDto = z.infer<typeof updateStaffSkillsDto>;

export const listStaffQueryDto = z.object({
  areaId: z.string().uuid().optional(),
  activeOnly: z.coerce.boolean().optional(),
  search: z.string().trim().max(200).optional(),
});

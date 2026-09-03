import { z } from "zod";

export const assignStaffDto = z.object({
  staffId: z.string().uuid(),
  rolOperativo: z.string().trim().min(1).max(150),
  horarioInicio: z.string().trim().max(10).nullish(),
  horarioFin: z.string().trim().max(10).nullish(),
});
export type AssignStaffDto = z.infer<typeof assignStaffDto>;

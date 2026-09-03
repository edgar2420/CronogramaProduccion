import { z } from "zod";

export const createTanqueDto = z.object({
  code: z.string().trim().min(1).max(50),
  areaId: z.string().uuid(),
});
export type CreateTanqueDto = z.infer<typeof createTanqueDto>;

export const listTanquesQueryDto = z.object({
  areaId: z.string().uuid().optional(),
});

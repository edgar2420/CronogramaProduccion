import { z } from "zod";

export const ensureSemanaDto = z.object({
  areaId: z.string().uuid(),
  fechaInicio: z.string().datetime().or(z.string().date()),
  fechaFin: z.string().datetime().or(z.string().date()),
});
export type EnsureSemanaDto = z.infer<typeof ensureSemanaDto>;

export const listSemanasQueryDto = z.object({
  areaId: z.string().uuid().optional(),
});

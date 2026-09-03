import { z } from "zod";

export const setCapacidadDto = z.object({
  tanqueId: z.string().uuid(),
  volumenUnitarioMl: z.number().positive(),
  volumenAValidarL: z.number().positive(),
  lotesProgramadosDia: z.number().positive(),
  cantidadTeoricaDia: z.number().positive(),
  horasEnvasado: z.number().positive().nullish(),
  horasAnalisis: z.number().positive().nullish(),
  observaciones: z.string().trim().max(1000).nullish(),
  changeReason: z.string().trim().min(3).max(500).optional(),
});
export type SetCapacidadDto = z.infer<typeof setCapacidadDto>;

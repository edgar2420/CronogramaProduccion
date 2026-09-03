import { z } from "zod";

const turnoEnum = z.enum(["manana", "tarde", "noche"]);
const estadoOrdenEnum = z.enum(["borrador", "en_proceso", "terminada", "cancelada"]);
const fecha = z.string().date().or(z.string().datetime());

// Campos del registro de fabricación real (ver AUDITORIA-DATOS.md).
const registroFabricacion = {
  opCode: z.string().trim().max(50).nullish(),
  numeroLote: z.string().trim().max(50).nullish(),
  correlativoFabricacion: z.number().int().positive().nullish(),
  correlativoProduccion: z.number().int().positive().nullish(),
  fechaVencimiento: z.string().trim().max(20).nullish(),
  volumenUnitarioL: z.number().positive().nullish(),
  volumenTotalL: z.number().positive().nullish(),
};

export const createOrdenDto = z.object({
  semanaId: z.string().uuid(),
  fecha,
  turno: turnoEnum,
  productId: z.string().uuid(),
  tanqueId: z.string().uuid().nullish(),
  planificado: z.number().positive(),
  ...registroFabricacion,
});
export type CreateOrdenDto = z.infer<typeof createOrdenDto>;

export const updateOrdenDto = z.object({
  fecha: fecha.optional(),
  turno: turnoEnum.optional(),
  productId: z.string().uuid().optional(),
  tanqueId: z.string().uuid().nullish(),
  planificado: z.number().positive().optional(),
  estado: estadoOrdenEnum.optional(),
  ...registroFabricacion,
});
export type UpdateOrdenDto = z.infer<typeof updateOrdenDto>;

export const registerRealDto = z.object({
  real: z.number().nonnegative(),
  observaciones: z.string().trim().max(1000).nullish(),
  fechaInicioReal: fecha.nullish(),
  fechaFinReal: fecha.nullish(),
});
export type RegisterRealDto = z.infer<typeof registerRealDto>;

export const cancelOrdenDto = z.object({
  motivoCancelacion: z.string().trim().min(3).max(500),
});
export type CancelOrdenDto = z.infer<typeof cancelOrdenDto>;

export const listOrdenesQueryDto = z.object({
  semanaId: z.string().uuid(),
});

import { z } from "zod";

export const createAreaDto = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(150),
  colorHex: z.string().trim().max(30).nullish(),
});
export type CreateAreaDto = z.infer<typeof createAreaDto>;

export const updateAreaDto = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  colorHex: z.string().trim().max(30).nullish(),
});
export type UpdateAreaDto = z.infer<typeof updateAreaDto>;

export const setAreaActiveDto = z.object({
  active: z.boolean(),
});
export type SetAreaActiveDto = z.infer<typeof setAreaActiveDto>;

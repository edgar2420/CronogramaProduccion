import { z } from "zod";

export const createProductDto = z.object({
  codigo: z.string().trim().min(1).max(20),
  nombre: z.string().trim().min(1).max(300),
  vol: z.string().trim().max(50).nullish(),
  envase: z.string().trim().max(300).nullish(),
  areaId: z.string().uuid(),
});
export type CreateProductDto = z.infer<typeof createProductDto>;

export const updateProductDto = z.object({
  codigo: z.string().trim().min(1).max(20).optional(),
  nombre: z.string().trim().min(1).max(300).optional(),
  vol: z.string().trim().max(50).nullish(),
  envase: z.string().trim().max(300).nullish(),
  areaId: z.string().uuid().optional(),
  changeReason: z.string().trim().min(3).max(500),
});
export type UpdateProductDto = z.infer<typeof updateProductDto>;

export const deactivateProductDto = z.object({
  changeReason: z.string().trim().min(3).max(500),
});
export type DeactivateProductDto = z.infer<typeof deactivateProductDto>;

export const listProductsQueryDto = z.object({
  areaId: z.string().uuid().optional(),
  activeOnly: z.coerce.boolean().optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(200).optional(),
});
export type ListProductsQueryDto = z.infer<typeof listProductsQueryDto>;

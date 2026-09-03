import { z } from "zod";

const roleEnum = z.enum(["superadmin", "admin", "usuario"]);

export const createUserDto = z.object({
  username: z.string().trim().min(3).max(50),
  name: z.string().trim().min(1).max(200),
  role: roleEnum,
  password: z.string().min(8).max(200),
});
export type CreateUserDto = z.infer<typeof createUserDto>;

export const updateUserDto = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  role: roleEnum.optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
});
export type UpdateUserDto = z.infer<typeof updateUserDto>;

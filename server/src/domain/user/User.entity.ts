export type Role = "superadmin" | "admin" | "usuario";

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  passwordHash: string;
  active: boolean;
  failedLoginCount: number;
  lockedUntil: Date | null;
  createdAt: Date;
}

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

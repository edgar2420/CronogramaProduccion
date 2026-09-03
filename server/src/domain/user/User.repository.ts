import type { Role, User } from "./User.entity.js";

export interface CreateUserData {
  username: string;
  name: string;
  role: Role;
  passwordHash: string;
}

export interface UpdateUserData {
  name?: string;
  role?: Role;
  active?: boolean;
  passwordHash?: string;
}

export interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  incrementFailedLogin(id: string, lockedUntil: Date | null): Promise<void>;
  resetFailedLogin(id: string): Promise<void>;
}

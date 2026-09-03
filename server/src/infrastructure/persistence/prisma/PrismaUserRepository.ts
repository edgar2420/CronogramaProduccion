import type { PrismaClient } from "@prisma/client";
import type { User } from "../../../domain/user/User.entity.js";
import type {
  CreateUserData,
  UpdateUserData,
  UserRepository,
} from "../../../domain/user/User.repository.js";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly client: PrismaClient) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.client.user.findUnique({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return this.client.user.findUnique({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.client.user.findMany({ orderBy: { username: "asc" } });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.client.user.create({ data });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return this.client.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
      },
    });
  }

  async incrementFailedLogin(id: string, lockedUntil: Date | null): Promise<void> {
    await this.client.user.update({
      where: { id },
      data: { failedLoginCount: { increment: 1 }, lockedUntil },
    });
  }

  async resetFailedLogin(id: string): Promise<void> {
    await this.client.user.update({
      where: { id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }
}

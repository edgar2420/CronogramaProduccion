import type { PrismaClient } from "@prisma/client";
import type { Tanque } from "../../../domain/tanque/Tanque.entity.js";
import type { CreateTanqueData, TanqueRepository } from "../../../domain/tanque/Tanque.repository.js";

export class PrismaTanqueRepository implements TanqueRepository {
  constructor(private readonly client: PrismaClient) {}

  async list(areaId?: string): Promise<Tanque[]> {
    return this.client.tanque.findMany({
      where: areaId ? { areaId } : undefined,
      orderBy: { code: "asc" },
    });
  }

  async findById(id: string): Promise<Tanque | null> {
    return this.client.tanque.findUnique({ where: { id } });
  }

  async findByCode(code: string): Promise<Tanque | null> {
    return this.client.tanque.findUnique({ where: { code } });
  }

  async create(data: CreateTanqueData): Promise<Tanque> {
    return this.client.tanque.create({ data });
  }
}

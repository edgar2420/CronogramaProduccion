import type { PrismaClient } from "@prisma/client";
import type { Area } from "../../../domain/area/Area.entity.js";
import type {
  AreaRepository,
  CreateAreaData,
  UpdateAreaData,
} from "../../../domain/area/Area.repository.js";

export class PrismaAreaRepository implements AreaRepository {
  constructor(private readonly client: PrismaClient) {}

  async findAll(): Promise<Area[]> {
    return this.client.area.findMany({ orderBy: { name: "asc" } });
  }

  async findById(id: string): Promise<Area | null> {
    return this.client.area.findUnique({ where: { id } });
  }

  async findByCode(code: string): Promise<Area | null> {
    return this.client.area.findUnique({ where: { code } });
  }

  async create(data: CreateAreaData): Promise<Area> {
    return this.client.area.create({
      data: { code: data.code, name: data.name, colorHex: data.colorHex ?? null },
    });
  }

  async update(id: string, data: UpdateAreaData): Promise<Area> {
    return this.client.area.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.colorHex !== undefined ? { colorHex: data.colorHex } : {}),
      },
    });
  }

  async setActive(id: string, active: boolean): Promise<Area> {
    return this.client.area.update({ where: { id }, data: { active } });
  }
}

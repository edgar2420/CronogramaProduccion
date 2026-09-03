import type { PrismaClient } from "@prisma/client";
import type { EstadoSemana, Semana } from "../../../domain/semana/Semana.entity.js";
import type { CreateSemanaData, SemanaRepository } from "../../../domain/semana/Semana.repository.js";

export class PrismaSemanaRepository implements SemanaRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<Semana | null> {
    return this.client.semana.findUnique({ where: { id } });
  }

  async findByAreaAndFechaInicio(areaId: string, fechaInicio: Date): Promise<Semana | null> {
    return this.client.semana.findUnique({ where: { areaId_fechaInicio: { areaId, fechaInicio } } });
  }

  async list(areaId?: string): Promise<Semana[]> {
    return this.client.semana.findMany({
      where: areaId ? { areaId } : undefined,
      orderBy: { fechaInicio: "desc" },
    });
  }

  async create(data: CreateSemanaData): Promise<Semana> {
    return this.client.semana.create({ data });
  }

  async setEstado(
    id: string,
    estado: EstadoSemana,
    meta: { publishedAt?: Date; publishedByUserId?: string; closedAt?: Date; closedByUserId?: string }
  ): Promise<Semana> {
    return this.client.semana.update({
      where: { id },
      data: {
        estado,
        ...(meta.publishedAt ? { publishedAt: meta.publishedAt } : {}),
        ...(meta.publishedByUserId ? { publishedByUserId: meta.publishedByUserId } : {}),
        ...(meta.closedAt ? { closedAt: meta.closedAt } : {}),
        ...(meta.closedByUserId ? { closedByUserId: meta.closedByUserId } : {}),
      },
    });
  }
}

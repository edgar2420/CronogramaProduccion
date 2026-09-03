import type { EstadoSemana, Semana } from "./Semana.entity.js";

export interface CreateSemanaData {
  areaId: string;
  fechaInicio: Date;
  fechaFin: Date;
}

export interface SemanaRepository {
  findById(id: string): Promise<Semana | null>;
  findByAreaAndFechaInicio(areaId: string, fechaInicio: Date): Promise<Semana | null>;
  list(areaId?: string): Promise<Semana[]>;
  create(data: CreateSemanaData): Promise<Semana>;
  setEstado(
    id: string,
    estado: EstadoSemana,
    meta: { publishedAt?: Date; publishedByUserId?: string; closedAt?: Date; closedByUserId?: string }
  ): Promise<Semana>;
}

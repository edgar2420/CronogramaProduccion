import type { SemanaRepository } from "../../domain/semana/Semana.repository.js";
import type { AreaRepository } from "../../domain/area/Area.repository.js";
import { NotFoundError } from "../../domain/shared/DomainError.js";

export interface EnsureSemanaInput {
  areaId: string;
  fechaInicio: Date;
  fechaFin: Date;
}

/** Reemplaza el `ensureSeed` client-side de DashboardPage.tsx: idempotente. */
export class EnsureSemanaUseCase {
  constructor(
    private readonly semanaRepository: SemanaRepository,
    private readonly areaRepository: AreaRepository
  ) {}

  async execute(input: EnsureSemanaInput) {
    const area = await this.areaRepository.findById(input.areaId);
    if (!area) throw new NotFoundError("Area", input.areaId);

    const existing = await this.semanaRepository.findByAreaAndFechaInicio(input.areaId, input.fechaInicio);
    if (existing) return existing;

    return this.semanaRepository.create(input);
  }
}

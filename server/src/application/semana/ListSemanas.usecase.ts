import type { SemanaRepository } from "../../domain/semana/Semana.repository.js";

export class ListSemanasUseCase {
  constructor(private readonly semanaRepository: SemanaRepository) {}

  async execute(areaId?: string) {
    return this.semanaRepository.list(areaId);
  }
}

import type { TanqueRepository } from "../../domain/tanque/Tanque.repository.js";

export class ListTanquesUseCase {
  constructor(private readonly tanqueRepository: TanqueRepository) {}

  async execute(areaId?: string) {
    return this.tanqueRepository.list(areaId);
  }
}

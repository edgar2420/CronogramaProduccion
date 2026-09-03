import type { OrdenRepository } from "../../domain/orden/Orden.repository.js";

export class ListOrdenesBySemanaUseCase {
  constructor(private readonly ordenRepository: OrdenRepository) {}

  async execute(semanaId: string) {
    return this.ordenRepository.listBySemana(semanaId);
  }
}

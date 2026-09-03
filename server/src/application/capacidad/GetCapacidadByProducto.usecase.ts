import type { CapacidadRepository } from "../../domain/capacidad/Capacidad.repository.js";

export class GetCapacidadByProductoUseCase {
  constructor(private readonly capacidadRepository: CapacidadRepository) {}

  async execute(productId: string) {
    return this.capacidadRepository.listByProducto(productId);
  }
}

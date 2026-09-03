import type { AsignacionRepository } from "../../domain/asignacion/Asignacion.repository.js";

export class ListAsignacionesByOrdenUseCase {
  constructor(private readonly asignacionRepository: AsignacionRepository) {}

  async execute(ordenId: string) {
    return this.asignacionRepository.listByOrden(ordenId);
  }
}

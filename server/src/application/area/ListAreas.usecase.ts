import type { AreaRepository } from "../../domain/area/Area.repository.js";

export class ListAreasUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute() {
    return this.areaRepository.findAll();
  }
}

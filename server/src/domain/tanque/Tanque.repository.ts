import type { Tanque } from "./Tanque.entity.js";

export interface CreateTanqueData {
  code: string;
  areaId: string;
}

export interface TanqueRepository {
  list(areaId?: string): Promise<Tanque[]>;
  findById(id: string): Promise<Tanque | null>;
  findByCode(code: string): Promise<Tanque | null>;
  create(data: CreateTanqueData): Promise<Tanque>;
}

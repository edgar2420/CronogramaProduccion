import type { Area } from "./Area.entity.js";

export interface CreateAreaData {
  code: string;
  name: string;
  colorHex?: string | null;
}

export interface UpdateAreaData {
  name?: string;
  colorHex?: string | null;
}

/** Puerto de persistencia para Area. Implementado por PrismaAreaRepository. */
export interface AreaRepository {
  findAll(): Promise<Area[]>;
  findById(id: string): Promise<Area | null>;
  findByCode(code: string): Promise<Area | null>;
  create(data: CreateAreaData): Promise<Area>;
  update(id: string, data: UpdateAreaData): Promise<Area>;
  setActive(id: string, active: boolean): Promise<Area>;
}

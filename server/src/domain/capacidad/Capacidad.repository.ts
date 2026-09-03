import type { CapacidadProductoTanque } from "./Capacidad.entity.js";

export interface CreateCapacidadData {
  productId: string;
  tanqueId: string;
  volumenUnitarioMl: number;
  volumenAValidarL: number;
  lotesProgramadosDia: number;
  cantidadTeoricaDia: number;
  horasEnvasado?: number | null;
  horasAnalisis?: number | null;
  observaciones?: string | null;
  createdByUserId: string;
}

export interface ReviseCapacidadData {
  volumenUnitarioMl?: number;
  volumenAValidarL?: number;
  lotesProgramadosDia?: number;
  cantidadTeoricaDia?: number;
  horasEnvasado?: number | null;
  horasAnalisis?: number | null;
  observaciones?: string | null;
  active?: boolean;
  changeReason: string;
  createdByUserId: string;
}

export interface CapacidadRepository {
  findCurrentById(id: string): Promise<CapacidadProductoTanque | null>;
  findCurrentByProductoYTanque(productId: string, tanqueId: string): Promise<CapacidadProductoTanque | null>;
  listByProducto(productId: string): Promise<CapacidadProductoTanque[]>;
  create(data: CreateCapacidadData): Promise<CapacidadProductoTanque>;
  createRevision(currentId: string, data: ReviseCapacidadData): Promise<CapacidadProductoTanque>;
}

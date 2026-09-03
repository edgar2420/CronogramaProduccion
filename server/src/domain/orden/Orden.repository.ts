import type { EstadoOrden, Orden, Turno } from "./Orden.entity.js";

export interface CreateOrdenData {
  semanaId: string;
  areaId: string;
  fecha: Date;
  turno: Turno;
  productId: string;
  tanqueId?: string | null;
  opCode?: string | null;
  numeroLote?: string | null;
  correlativoFabricacion?: number | null;
  correlativoProduccion?: number | null;
  fechaVencimiento?: string | null;
  volumenUnitarioL?: number | null;
  volumenTotalL?: number | null;
  planificado: number;
  createdByUserId: string;
}

export interface UpdateOrdenData {
  fecha?: Date;
  turno?: Turno;
  productId?: string;
  tanqueId?: string | null;
  opCode?: string | null;
  numeroLote?: string | null;
  correlativoFabricacion?: number | null;
  correlativoProduccion?: number | null;
  fechaVencimiento?: string | null;
  volumenUnitarioL?: number | null;
  volumenTotalL?: number | null;
  planificado?: number;
  estado?: EstadoOrden;
}

export interface RegisterRealData {
  real: number;
  observaciones?: string | null;
  fechaInicioReal?: Date | null;
  fechaFinReal?: Date | null;
  /** Ya decidido por el caso de uso (regla de negocio testeable sin DB), el repositorio solo persiste. */
  estado: EstadoOrden;
}

export interface CancelOrdenData {
  motivoCancelacion: string;
}

export interface OrdenRepository {
  findById(id: string): Promise<Orden | null>;
  findByNumeroLote(numeroLote: string): Promise<Orden | null>;
  listBySemana(semanaId: string): Promise<Orden[]>;
  countBorradorBySemana(semanaId: string): Promise<number>;
  create(data: CreateOrdenData): Promise<Orden>;
  update(id: string, data: UpdateOrdenData): Promise<Orden>;
  registerReal(id: string, data: RegisterRealData): Promise<Orden>;
  /** Cancela el lote conservando el registro (nunca se borra). */
  cancel(id: string, data: CancelOrdenData): Promise<Orden>;
  /** Baja lógica: nunca DELETE de fila. */
  deactivate(id: string): Promise<Orden>;
  /** Usado por PublishSemana: pasa todas las órdenes en "borrador" de una semana a "en_proceso". */
  bulkTransitionBorradorToEnProceso(semanaId: string): Promise<number>;
}

import type { Turno } from "../orden/Orden.entity.js";
import type { AsignacionPersonal } from "./Asignacion.entity.js";

export interface CreateAsignacionData {
  ordenId: string;
  staffId: string;
  fecha: Date;
  turno: Turno;
  areaId: string;
  rolOperativo: string;
  horarioInicio?: string | null;
  horarioFin?: string | null;
  createdByUserId: string;
}

export interface AsignacionRepository {
  findById(id: string): Promise<AsignacionPersonal | null>;
  listByOrden(ordenId: string): Promise<AsignacionPersonal[]>;
  /** Todas las asignaciones activas de un staff en una fecha+turno, en CUALQUIER área/semana. */
  findActiveByStaffFechaTurno(staffId: string, fecha: Date, turno: Turno): Promise<AsignacionPersonal[]>;
  create(data: CreateAsignacionData): Promise<AsignacionPersonal>;
  /** Baja lógica (nunca DELETE de fila). */
  revoke(id: string): Promise<AsignacionPersonal>;
}

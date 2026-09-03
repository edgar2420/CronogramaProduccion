import type { Turno } from "../orden/Orden.entity.js";

export interface AsignacionPersonal {
  id: string;
  ordenId: string;
  staffId: string;
  fecha: Date;
  turno: Turno;
  areaId: string;
  rolOperativo: string;
  horarioInicio: string | null;
  horarioFin: string | null;
  active: boolean;
  createdByUserId: string;
  createdAt: Date;
}

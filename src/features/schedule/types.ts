export type EstadoSemana = "borrador" | "publicado" | "cerrado";
export type EstadoOrden = "borrador" | "en_proceso" | "terminada" | "cancelada";
export type EstadoProceso = "En produccion" | "produciendo" | "";

// ⬅ Se agregó "noche"
export type Turno = "mañana" | "tarde" | "noche";

export interface Orden {
  id: string;
  fecha: string;
  turno: Turno;
  productoId: string;
  productoNombre: string;
  planificado: number;
  real?: number;
  estado: EstadoOrden;
  /** Ids de personal (Staff.id), no nombres — se resuelven al mostrar. */
  asignados: string[];
  areaId: string;
  opCode?: string;
  observaciones?: string;
  createdAt: string;

  // Registro de fabricación real (server/AUDITORIA-DATOS.md). Todo opcional:
  // una orden recién creada puede no tenerlos aún.
  numeroLote?: string;
  correlativoFabricacion?: number;
  correlativoProduccion?: number;
  fechaVencimiento?: string;
  volumenUnitarioL?: number;
  volumenTotalL?: number;
  fechaInicioReal?: string;
  fechaFinReal?: string;
  motivoCancelacion?: string;
}

export interface Semana {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  areaId: string;
  estado: EstadoSemana;
  ordenes: Orden[];
}

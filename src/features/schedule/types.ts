export type EstadoSemana = "borrador" | "publicado" | "cerrado";
export type EstadoOrden = "borrador" | "en_proceso" | "terminada";
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
  asignados: string[];
  areaId: string;
  opCode?: string;
  observaciones?: string;
  createdAt: string;
}

export interface Semana {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  areaId: string;
  estado: EstadoSemana;
  ordenes: Orden[];
}

export type EstadoSemana = "borrador" | "publicado" | "cerrado";

export interface Semana {
  id: string;
  areaId: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: EstadoSemana;
  publishedAt: Date | null;
  publishedByUserId: string | null;
  closedAt: Date | null;
  closedByUserId: string | null;
  createdAt: Date;
}

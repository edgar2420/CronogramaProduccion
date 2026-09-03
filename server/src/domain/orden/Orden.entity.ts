export type Turno = "manana" | "tarde" | "noche";
export type EstadoOrden = "borrador" | "en_proceso" | "terminada" | "cancelada";

/**
 * Registro de fabricación: se corresponde 1:1 con una O.P. y un Nº de lote
 * del "CRONOGRAMA DE FABRICACIÓN" real de la planta (ver AUDITORIA-DATOS.md).
 */
export interface Orden {
  id: string;
  semanaId: string;
  areaId: string;
  fecha: Date;
  turno: Turno;
  productId: string;
  tanqueId: string | null;

  // Identificación del registro de fabricación
  opCode: string | null;
  numeroLote: string | null;
  correlativoFabricacion: number | null;
  correlativoProduccion: number | null;
  fechaVencimiento: string | null;

  // Volúmenes programados
  volumenUnitarioL: string | null;
  volumenTotalL: string | null;
  planificado: string;

  // Cumplido
  real: string | null;
  fechaInicioReal: Date | null;
  fechaFinReal: Date | null;
  observaciones: string | null;

  estado: EstadoOrden;
  motivoCancelacion: string | null;
  active: boolean;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CapacidadProductoTanque {
  id: string;
  groupId: string;
  version: number;
  productId: string;
  tanqueId: string;
  volumenUnitarioMl: string; // Prisma Decimal serializado como string en el dominio
  volumenAValidarL: string;
  lotesProgramadosDia: string;
  cantidadTeoricaDia: string;
  horasEnvasado: string | null;
  horasAnalisis: string | null;
  observaciones: string | null;
  active: boolean;
  validFrom: Date;
  validTo: Date | null;
  supersededById: string | null;
  changeReason: string | null;
  createdByUserId: string;
  createdAt: Date;
}

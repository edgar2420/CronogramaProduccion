export interface Product {
  id: string;
  productGroupId: string;
  version: number;
  codigo: string;
  nombre: string;
  vol: string | null;
  envase: string | null;
  areaId: string;
  active: boolean;
  validFrom: Date;
  validTo: Date | null;
  supersededById: string | null;
  changeReason: string | null;
  createdByUserId: string;
  createdAt: Date;
}

/** Invariantes de dominio para un producto, validadas antes de persistir. */
export function assertValidProductInput(input: {
  codigo: string;
  nombre: string;
  areaId: string;
}): void {
  if (!input.codigo?.trim()) {
    throw new Error("El código del producto es obligatorio");
  }
  if (!input.nombre?.trim()) {
    throw new Error("El nombre del producto es obligatorio");
  }
  if (!input.areaId?.trim()) {
    throw new Error("El área del producto es obligatoria");
  }
}

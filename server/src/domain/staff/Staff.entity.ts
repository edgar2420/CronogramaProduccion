export type RolBaseStaff = "Operador" | "Supervisor" | "Tecnologo";
export type SkillLevel = "ok" | "reforzar" | "capacitar";
export type SkillsMap = Record<string, SkillLevel>;

export interface Staff {
  id: string;
  staffGroupId: string;
  version: number;
  nombre: string;
  codigoEmpleado: string | null;
  rolBase: RolBaseStaff;
  areaIds: string[];
  skills: SkillsMap | null;
  active: boolean;
  validFrom: Date;
  validTo: Date | null;
  supersededById: string | null;
  changeReason: string | null;
  createdByUserId: string;
  createdAt: Date;
}

export function assertValidStaffInput(input: { nombre: string; rolBase: string }): void {
  if (!input.nombre?.trim()) throw new Error("El nombre del personal es obligatorio");
  if (!["Operador", "Supervisor", "Tecnologo"].includes(input.rolBase)) {
    throw new Error("rolBase inválido");
  }
}

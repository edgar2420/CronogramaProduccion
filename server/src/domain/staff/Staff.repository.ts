import type { RolBaseStaff, SkillsMap, Staff } from "./Staff.entity.js";

export interface CreateStaffData {
  nombre: string;
  codigoEmpleado?: string | null;
  rolBase: RolBaseStaff;
  areaIds: string[];
  createdByUserId: string;
}

export interface ReviseStaffData {
  nombre?: string;
  codigoEmpleado?: string | null;
  rolBase?: RolBaseStaff;
  areaIds?: string[];
  active?: boolean;
  changeReason: string;
  createdByUserId: string;
}

export interface ListStaffFilter {
  areaId?: string;
  activeOnly?: boolean;
  search?: string;
}

export interface StaffRepository {
  findCurrentById(id: string): Promise<Staff | null>;
  list(filter: ListStaffFilter): Promise<Staff[]>;
  create(data: CreateStaffData): Promise<Staff>;
  createRevision(currentId: string, data: ReviseStaffData): Promise<Staff>;
  /** Actualiza `skills` en el sitio (no versiona el Staff, ver comentario en schema.prisma). */
  updateSkills(id: string, skills: SkillsMap): Promise<Staff>;
}

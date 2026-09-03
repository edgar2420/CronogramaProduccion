import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { SkillsMap, Staff } from "../../../domain/staff/Staff.entity.js";
import type {
  CreateStaffData,
  ListStaffFilter,
  ReviseStaffData,
  StaffRepository,
} from "../../../domain/staff/Staff.repository.js";
import { NotFoundError } from "../../../domain/shared/DomainError.js";

type PrismaStaffRow = Awaited<ReturnType<PrismaClient["staff"]["create"]>>;

function toDomain(row: PrismaStaffRow): Staff {
  return { ...row, skills: (row.skills as unknown as SkillsMap | null) ?? null };
}

export class PrismaStaffRepository implements StaffRepository {
  constructor(private readonly client: PrismaClient) {}

  async findCurrentById(id: string): Promise<Staff | null> {
    const row = await this.client.staff.findFirst({ where: { id, validTo: null } });
    return row ? toDomain(row) : null;
  }

  async list(filter: ListStaffFilter): Promise<Staff[]> {
    const rows = await this.client.staff.findMany({
      where: {
        validTo: null,
        ...(filter.activeOnly ? { active: true } : {}),
        ...(filter.areaId ? { areaIds: { has: filter.areaId } } : {}),
        ...(filter.search
          ? { nombre: { contains: filter.search, mode: "insensitive" as const } }
          : {}),
      },
      orderBy: { nombre: "asc" },
    });
    return rows.map(toDomain);
  }

  async create(data: CreateStaffData): Promise<Staff> {
    const row = await this.client.staff.create({
      data: {
        staffGroupId: randomUUID(),
        version: 1,
        nombre: data.nombre,
        codigoEmpleado: data.codigoEmpleado ?? null,
        rolBase: data.rolBase,
        areaIds: data.areaIds,
        createdByUserId: data.createdByUserId,
      },
    });
    return toDomain(row);
  }

  async createRevision(currentId: string, data: ReviseStaffData): Promise<Staff> {
    return this.client.$transaction(async (tx) => {
      const current = await tx.staff.findFirst({ where: { id: currentId, validTo: null } });
      if (!current) throw new NotFoundError("Staff", currentId);

      const next = await tx.staff.create({
        data: {
          staffGroupId: current.staffGroupId,
          version: current.version + 1,
          nombre: data.nombre ?? current.nombre,
          codigoEmpleado: data.codigoEmpleado !== undefined ? data.codigoEmpleado : current.codigoEmpleado,
          rolBase: data.rolBase ?? current.rolBase,
          areaIds: data.areaIds ?? current.areaIds,
          active: data.active !== undefined ? data.active : current.active,
          skills: current.skills ?? undefined,
          changeReason: data.changeReason,
          createdByUserId: data.createdByUserId,
        },
      });

      await tx.staff.update({
        where: { id: current.id },
        data: { validTo: new Date(), supersededById: next.id },
      });

      return toDomain(next);
    });
  }

  async updateSkills(id: string, skills: SkillsMap): Promise<Staff> {
    const row = await this.client.staff.update({
      where: { id },
      data: { skills: skills as object },
    });
    return toDomain(row);
  }
}

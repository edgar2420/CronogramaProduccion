import type { PrismaClient } from "@prisma/client";
import type { Turno } from "../../../domain/orden/Orden.entity.js";
import type { AsignacionPersonal } from "../../../domain/asignacion/Asignacion.entity.js";
import type {
  AsignacionRepository,
  CreateAsignacionData,
} from "../../../domain/asignacion/Asignacion.repository.js";

export class PrismaAsignacionRepository implements AsignacionRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<AsignacionPersonal | null> {
    return this.client.asignacionPersonal.findUnique({ where: { id } });
  }

  async listByOrden(ordenId: string): Promise<AsignacionPersonal[]> {
    return this.client.asignacionPersonal.findMany({
      where: { ordenId, active: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async findActiveByStaffFechaTurno(
    staffId: string,
    fecha: Date,
    turno: Turno
  ): Promise<AsignacionPersonal[]> {
    return this.client.asignacionPersonal.findMany({
      where: { staffId, fecha, turno, active: true },
    });
  }

  async create(data: CreateAsignacionData): Promise<AsignacionPersonal> {
    return this.client.asignacionPersonal.create({
      data: {
        ordenId: data.ordenId,
        staffId: data.staffId,
        fecha: data.fecha,
        turno: data.turno,
        areaId: data.areaId,
        rolOperativo: data.rolOperativo,
        horarioInicio: data.horarioInicio ?? null,
        horarioFin: data.horarioFin ?? null,
        createdByUserId: data.createdByUserId,
      },
    });
  }

  async revoke(id: string): Promise<AsignacionPersonal> {
    return this.client.asignacionPersonal.update({ where: { id }, data: { active: false } });
  }
}

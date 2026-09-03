import type { AsignacionRepository } from "../../domain/asignacion/Asignacion.repository.js";
import type { OrdenRepository } from "../../domain/orden/Orden.repository.js";
import type { StaffRepository } from "../../domain/staff/Staff.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { ConflictError, NotFoundError, ValidationError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface AssignStaffInput {
  ordenId: string;
  staffId: string;
  rolOperativo: string;
  horarioInicio?: string | null;
  horarioFin?: string | null;
}

/**
 * Reemplaza `Orden.asignados: string[]` (que mezclaba ids y nombres, ver
 * DashboardPage.tsx/AssignStaffModal.tsx). El conflicto — misma persona,
 * misma fecha+turno, área DISTINTA — se resuelve con una consulta que cruza
 * TODAS las semanas, no solo la que el cliente tiene cargada en memoria.
 */
export class AssignStaffUseCase {
  constructor(
    private readonly asignacionRepository: AsignacionRepository,
    private readonly ordenRepository: OrdenRepository,
    private readonly staffRepository: StaffRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(input: AssignStaffInput, actor: ActorContext) {
    if (!input.rolOperativo?.trim()) throw new ValidationError("rolOperativo es obligatorio");

    const orden = await this.ordenRepository.findById(input.ordenId);
    if (!orden) throw new NotFoundError("Orden", input.ordenId);

    const staff = await this.staffRepository.findCurrentById(input.staffId);
    if (!staff) throw new NotFoundError("Staff", input.staffId);

    const conflictos = await this.asignacionRepository.findActiveByStaffFechaTurno(
      input.staffId,
      orden.fecha,
      orden.turno
    );
    const conflictoEnOtraArea = conflictos.find((c) => c.areaId !== orden.areaId);
    if (conflictoEnOtraArea) {
      throw new ConflictError(
        `${staff.nombre} ya está asignado ese turno en otra área (orden ${conflictoEnOtraArea.ordenId})`
      );
    }

    const asignacion = await this.asignacionRepository.create({
      ordenId: input.ordenId,
      staffId: input.staffId,
      fecha: orden.fecha,
      turno: orden.turno,
      areaId: orden.areaId,
      rolOperativo: input.rolOperativo,
      horarioInicio: input.horarioInicio ?? null,
      horarioFin: input.horarioFin ?? null,
      createdByUserId: actor.userId,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "ASIGNACION_CREATE",
      entityType: "AsignacionPersonal",
      entityId: asignacion.id,
      afterJson: asignacion,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return asignacion;
  }
}

import type { StaffRepository } from "../../domain/staff/Staff.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import type { RolBaseStaff } from "../../domain/staff/Staff.entity.js";
import { NotFoundError, ValidationError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface UpdateStaffInput {
  nombre?: string;
  codigoEmpleado?: string | null;
  rolBase?: RolBaseStaff;
  areaIds?: string[];
  changeReason: string;
}

export class UpdateStaffUseCase {
  constructor(
    private readonly staffRepository: StaffRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(currentId: string, input: UpdateStaffInput, actor: ActorContext) {
    if (!input.changeReason?.trim()) {
      throw new ValidationError("changeReason es obligatorio al editar personal");
    }
    const before = await this.staffRepository.findCurrentById(currentId);
    if (!before) throw new NotFoundError("Staff", currentId);

    const after = await this.staffRepository.createRevision(currentId, {
      nombre: input.nombre,
      codigoEmpleado: input.codigoEmpleado,
      rolBase: input.rolBase,
      areaIds: input.areaIds,
      changeReason: input.changeReason,
      createdByUserId: actor.userId,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "STAFF_UPDATE",
      entityType: "Staff",
      entityId: after.id,
      beforeJson: before,
      afterJson: after,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return after;
  }
}

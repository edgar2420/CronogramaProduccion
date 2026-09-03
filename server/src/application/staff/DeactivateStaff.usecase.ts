import type { StaffRepository } from "../../domain/staff/Staff.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { NotFoundError, ValidationError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export class DeactivateStaffUseCase {
  constructor(
    private readonly staffRepository: StaffRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(currentId: string, changeReason: string, actor: ActorContext) {
    if (!changeReason?.trim()) {
      throw new ValidationError("changeReason es obligatorio al desactivar personal");
    }
    const before = await this.staffRepository.findCurrentById(currentId);
    if (!before) throw new NotFoundError("Staff", currentId);

    const after = await this.staffRepository.createRevision(currentId, {
      active: false,
      changeReason,
      createdByUserId: actor.userId,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "STAFF_DEACTIVATE",
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

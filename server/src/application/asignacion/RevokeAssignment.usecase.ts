import type { AsignacionRepository } from "../../domain/asignacion/Asignacion.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { NotFoundError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export class RevokeAssignmentUseCase {
  constructor(
    private readonly asignacionRepository: AsignacionRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(id: string, actor: ActorContext) {
    const before = await this.asignacionRepository.findById(id);
    if (!before) throw new NotFoundError("AsignacionPersonal", id);

    const after = await this.asignacionRepository.revoke(id);

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "ASIGNACION_REVOKE",
      entityType: "AsignacionPersonal",
      entityId: id,
      beforeJson: before,
      afterJson: after,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return after;
  }
}

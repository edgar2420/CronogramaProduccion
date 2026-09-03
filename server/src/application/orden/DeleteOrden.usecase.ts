import type { OrdenRepository } from "../../domain/orden/Orden.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { NotFoundError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

/** Baja lógica: la fila nunca se borra de la base de datos. */
export class DeleteOrdenUseCase {
  constructor(
    private readonly ordenRepository: OrdenRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(id: string, actor: ActorContext) {
    const before = await this.ordenRepository.findById(id);
    if (!before) throw new NotFoundError("Orden", id);

    const after = await this.ordenRepository.deactivate(id);

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "ORDEN_DEACTIVATE",
      entityType: "Orden",
      entityId: id,
      beforeJson: before,
      afterJson: after,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return after;
  }
}

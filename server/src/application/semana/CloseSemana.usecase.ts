import type { SemanaRepository } from "../../domain/semana/Semana.repository.js";
import type { OrdenRepository } from "../../domain/orden/Orden.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import type { Clock } from "../../domain/shared/Clock.js";
import { ConflictError, NotFoundError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

/**
 * Cierra una semana publicada. Antes no existía ningún flujo real que
 * hiciera esto (solo un filtro de UI huérfano). Exige que la semana esté
 * publicada y que no queden órdenes en "borrador".
 */
export class CloseSemanaUseCase {
  constructor(
    private readonly semanaRepository: SemanaRepository,
    private readonly ordenRepository: OrdenRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly clock: Clock
  ) {}

  async execute(semanaId: string, actor: ActorContext) {
    const before = await this.semanaRepository.findById(semanaId);
    if (!before) throw new NotFoundError("Semana", semanaId);
    if (before.estado !== "publicado") {
      throw new ConflictError("Solo se puede cerrar una semana que ya fue publicada");
    }

    const pendientes = await this.ordenRepository.countBorradorBySemana(semanaId);
    if (pendientes > 0) {
      throw new ConflictError(`Hay ${pendientes} orden(es) en borrador; resuélvelas antes de cerrar la semana`);
    }

    const after = await this.semanaRepository.setEstado(semanaId, "cerrado", {
      closedAt: this.clock.now(),
      closedByUserId: actor.userId,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "SEMANA_CLOSE",
      entityType: "Semana",
      entityId: semanaId,
      beforeJson: before,
      afterJson: after,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return after;
  }
}

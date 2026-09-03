import type { SemanaRepository } from "../../domain/semana/Semana.repository.js";
import type { OrdenRepository } from "../../domain/orden/Orden.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import type { Clock } from "../../domain/shared/Clock.js";
import { ConflictError, NotFoundError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

/**
 * Publica una semana: estado -> publicado + todas sus órdenes en "borrador"
 * pasan a "en_proceso" (misma regla que hoy tenía schedule.store.ts en el
 * cliente, ahora aplicada server-side y auditada).
 */
export class PublishSemanaUseCase {
  constructor(
    private readonly semanaRepository: SemanaRepository,
    private readonly ordenRepository: OrdenRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly clock: Clock
  ) {}

  async execute(semanaId: string, actor: ActorContext) {
    const before = await this.semanaRepository.findById(semanaId);
    if (!before) throw new NotFoundError("Semana", semanaId);
    if (before.estado !== "borrador") {
      throw new ConflictError(`La semana ya está en estado '${before.estado}', no se puede publicar de nuevo`);
    }

    const transitioned = await this.ordenRepository.bulkTransitionBorradorToEnProceso(semanaId);

    const after = await this.semanaRepository.setEstado(semanaId, "publicado", {
      publishedAt: this.clock.now(),
      publishedByUserId: actor.userId,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "SEMANA_PUBLISH",
      entityType: "Semana",
      entityId: semanaId,
      beforeJson: before,
      afterJson: { ...after, ordenesTransicionadas: transitioned },
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return after;
  }
}

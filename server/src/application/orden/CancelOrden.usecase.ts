import type { OrdenRepository } from "../../domain/orden/Orden.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { ConflictError, NotFoundError, ValidationError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

/**
 * Cancela un lote conservando el registro completo (nunca se borra la orden ni
 * se libera el Nº de lote). La planta cancela lotes a diario por fallas de
 * máquina o temperatura fuera de rango, y hoy eso quedaba solo como texto
 * suelto en las observaciones de la planilla.
 */
export class CancelOrdenUseCase {
  constructor(
    private readonly ordenRepository: OrdenRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(id: string, motivoCancelacion: string, actor: ActorContext) {
    if (!motivoCancelacion?.trim()) {
      throw new ValidationError("El motivo de cancelación es obligatorio");
    }

    const before = await this.ordenRepository.findById(id);
    if (!before) throw new NotFoundError("Orden", id);
    if (before.estado === "terminada") {
      throw new ConflictError("No se puede cancelar un lote ya terminado");
    }
    if (before.estado === "cancelada") {
      throw new ConflictError("El lote ya está cancelado");
    }

    const after = await this.ordenRepository.cancel(id, { motivoCancelacion });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "ORDEN_CANCEL",
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

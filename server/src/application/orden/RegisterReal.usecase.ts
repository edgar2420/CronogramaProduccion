import type { OrdenRepository } from "../../domain/orden/Orden.repository.js";
import type { EstadoOrden } from "../../domain/orden/Orden.entity.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { ConflictError, NotFoundError, ValidationError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface RegisterRealInput {
  real: number;
  observaciones?: string | null;
  /** "CUMPLIDO" de la planilla real: un lote puede abarcar más de un día. */
  fechaInicioReal?: string | null;
  fechaFinReal?: string | null;
}

/**
 * Registra el cumplido de una orden. `observaciones` se persiste siempre
 * (antes el frontend lo descartaba). La transición a "terminada" cuando
 * real >= planificado se decide aquí (testeable sin DB), no en el cliente.
 */
export class RegisterRealUseCase {
  constructor(
    private readonly ordenRepository: OrdenRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(id: string, input: RegisterRealInput, actor: ActorContext) {
    if (input.real < 0) throw new ValidationError("real no puede ser negativo");

    const before = await this.ordenRepository.findById(id);
    if (!before) throw new NotFoundError("Orden", id);
    if (before.estado === "cancelada") {
      throw new ConflictError("No se puede registrar producción de un lote cancelado");
    }

    const fechaInicioReal = input.fechaInicioReal ? new Date(input.fechaInicioReal) : undefined;
    const fechaFinReal = input.fechaFinReal ? new Date(input.fechaFinReal) : undefined;
    if (fechaInicioReal && fechaFinReal && fechaFinReal < fechaInicioReal) {
      throw new ValidationError("La fecha final no puede ser anterior a la fecha de inicio");
    }

    const estado: EstadoOrden = input.real >= Number(before.planificado) ? "terminada" : before.estado;

    const after = await this.ordenRepository.registerReal(id, {
      real: input.real,
      observaciones: input.observaciones ?? null,
      fechaInicioReal,
      fechaFinReal,
      estado,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "ORDEN_REGISTER_REAL",
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

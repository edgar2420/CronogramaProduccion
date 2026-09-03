import type { OrdenRepository } from "../../domain/orden/Orden.repository.js";
import type { Turno, EstadoOrden } from "../../domain/orden/Orden.entity.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { ConflictError, NotFoundError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface UpdateOrdenInput {
  fecha?: string;
  turno?: Turno;
  productId?: string;
  tanqueId?: string | null;
  opCode?: string | null;
  numeroLote?: string | null;
  correlativoFabricacion?: number | null;
  correlativoProduccion?: number | null;
  fechaVencimiento?: string | null;
  volumenUnitarioL?: number | null;
  volumenTotalL?: number | null;
  planificado?: number;
  estado?: EstadoOrden;
}

export class UpdateOrdenUseCase {
  constructor(
    private readonly ordenRepository: OrdenRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(id: string, input: UpdateOrdenInput, actor: ActorContext) {
    const before = await this.ordenRepository.findById(id);
    if (!before) throw new NotFoundError("Orden", id);

    // Un Nº de lote no puede quedar duplicado entre órdenes activas.
    if (input.numeroLote && input.numeroLote !== before.numeroLote) {
      const existente = await this.ordenRepository.findByNumeroLote(input.numeroLote);
      if (existente && existente.id !== id) {
        throw new ConflictError(`El Nº de lote ${input.numeroLote} ya está registrado en otra orden`);
      }
    }

    const after = await this.ordenRepository.update(id, {
      fecha: input.fecha ? new Date(input.fecha) : undefined,
      turno: input.turno,
      productId: input.productId,
      tanqueId: input.tanqueId,
      opCode: input.opCode,
      numeroLote: input.numeroLote,
      correlativoFabricacion: input.correlativoFabricacion,
      correlativoProduccion: input.correlativoProduccion,
      fechaVencimiento: input.fechaVencimiento,
      volumenUnitarioL: input.volumenUnitarioL,
      volumenTotalL: input.volumenTotalL,
      planificado: input.planificado,
      estado: input.estado,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "ORDEN_UPDATE",
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

import type { OrdenRepository } from "../../domain/orden/Orden.repository.js";
import type { Turno } from "../../domain/orden/Orden.entity.js";
import type { SemanaRepository } from "../../domain/semana/Semana.repository.js";
import type { ProductRepository } from "../../domain/product/Product.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { ConflictError, NotFoundError, ValidationError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface CreateOrdenInput {
  semanaId: string;
  fecha: string; // ISO date
  turno: Turno;
  productId: string;
  tanqueId?: string | null;
  opCode?: string | null;
  numeroLote?: string | null;
  correlativoFabricacion?: number | null;
  correlativoProduccion?: number | null;
  fechaVencimiento?: string | null;
  volumenUnitarioL?: number | null;
  volumenTotalL?: number | null;
  planificado: number;
}

/** productId ahora es un id real de Product (se acaba el "AUTO" hardcodeado del frontend). */
export class CreateOrdenUseCase {
  constructor(
    private readonly ordenRepository: OrdenRepository,
    private readonly semanaRepository: SemanaRepository,
    private readonly productRepository: ProductRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(input: CreateOrdenInput, actor: ActorContext) {
    if (input.planificado <= 0) throw new ValidationError("planificado debe ser mayor a 0");

    const semana = await this.semanaRepository.findById(input.semanaId);
    if (!semana) throw new NotFoundError("Semana", input.semanaId);
    if (semana.estado !== "borrador") {
      throw new ConflictError("No se pueden agregar órdenes a una semana que ya fue publicada o cerrada");
    }

    const product = await this.productRepository.findCurrentById(input.productId);
    if (!product) throw new NotFoundError("Product", input.productId);

    // El Nº de lote identifica el producto liberado: no puede repetirse.
    if (input.numeroLote) {
      const existente = await this.ordenRepository.findByNumeroLote(input.numeroLote);
      if (existente) {
        throw new ConflictError(`El Nº de lote ${input.numeroLote} ya está registrado en otra orden`);
      }
    }

    const orden = await this.ordenRepository.create({
      semanaId: input.semanaId,
      areaId: semana.areaId,
      fecha: new Date(input.fecha),
      turno: input.turno,
      productId: input.productId,
      tanqueId: input.tanqueId ?? null,
      opCode: input.opCode ?? null,
      numeroLote: input.numeroLote ?? null,
      correlativoFabricacion: input.correlativoFabricacion ?? null,
      correlativoProduccion: input.correlativoProduccion ?? null,
      fechaVencimiento: input.fechaVencimiento ?? null,
      volumenUnitarioL: input.volumenUnitarioL ?? null,
      volumenTotalL: input.volumenTotalL ?? null,
      planificado: input.planificado,
      createdByUserId: actor.userId,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "ORDEN_CREATE",
      entityType: "Orden",
      entityId: orden.id,
      afterJson: orden,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return orden;
  }
}

import type { ProductRepository } from "../../domain/product/Product.repository.js";
import type { AreaRepository } from "../../domain/area/Area.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { NotFoundError, ValidationError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface UpdateProductInput {
  codigo?: string;
  nombre?: string;
  vol?: string | null;
  envase?: string | null;
  areaId?: string;
  /** Obligatorio: por qué se corrige el registro (buenas prácticas de documentación). */
  changeReason: string;
}

/**
 * Editar un producto NUNCA muta la fila vigente: cierra la versión actual
 * (validTo) y crea una nueva versión enlazada por productGroupId. La versión
 * anterior queda intacta y consultable vía GetProductHistory.
 */
export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly areaRepository: AreaRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(currentId: string, input: UpdateProductInput, actor: ActorContext) {
    if (!input.changeReason?.trim()) {
      throw new ValidationError("changeReason es obligatorio al editar un producto");
    }

    const before = await this.productRepository.findCurrentById(currentId);
    if (!before) throw new NotFoundError("Product", currentId);

    if (input.areaId) {
      const area = await this.areaRepository.findById(input.areaId);
      if (!area) throw new NotFoundError("Area", input.areaId);
    }

    const after = await this.productRepository.createRevision(currentId, {
      codigo: input.codigo,
      nombre: input.nombre,
      vol: input.vol,
      envase: input.envase,
      areaId: input.areaId,
      changeReason: input.changeReason,
      createdByUserId: actor.userId,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "PRODUCT_UPDATE",
      entityType: "Product",
      entityId: after.id,
      beforeJson: before,
      afterJson: after,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return after;
  }
}

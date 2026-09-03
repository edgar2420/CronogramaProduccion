import type { ProductRepository } from "../../domain/product/Product.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { NotFoundError, ValidationError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface DeactivateProductInput {
  changeReason: string;
}

/** Baja lógica: crea una nueva versión con active=false. Nunca borra la fila. */
export class DeactivateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(currentId: string, input: DeactivateProductInput, actor: ActorContext) {
    if (!input.changeReason?.trim()) {
      throw new ValidationError("changeReason es obligatorio al desactivar un producto");
    }

    const before = await this.productRepository.findCurrentById(currentId);
    if (!before) throw new NotFoundError("Product", currentId);

    const after = await this.productRepository.createRevision(currentId, {
      active: false,
      changeReason: input.changeReason,
      createdByUserId: actor.userId,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "PRODUCT_DEACTIVATE",
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

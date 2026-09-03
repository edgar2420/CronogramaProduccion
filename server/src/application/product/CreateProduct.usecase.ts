import type { ProductRepository } from "../../domain/product/Product.repository.js";
import type { AreaRepository } from "../../domain/area/Area.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { assertValidProductInput } from "../../domain/product/Product.entity.js";
import { ConflictError, NotFoundError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface CreateProductInput {
  codigo: string;
  nombre: string;
  vol?: string | null;
  envase?: string | null;
  areaId: string;
}

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly areaRepository: AreaRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(input: CreateProductInput, actor: ActorContext) {
    assertValidProductInput(input);

    const area = await this.areaRepository.findById(input.areaId);
    if (!area) throw new NotFoundError("Area", input.areaId);

    const existing = await this.productRepository.findCurrentByAreaAndCodigo(input.areaId, input.codigo);
    if (existing) {
      throw new ConflictError(
        `Ya existe un producto vigente con código ${input.codigo} en el área ${area.code}`
      );
    }

    const product = await this.productRepository.create({
      codigo: input.codigo,
      nombre: input.nombre,
      vol: input.vol ?? null,
      envase: input.envase ?? null,
      areaId: input.areaId,
      createdByUserId: actor.userId,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "PRODUCT_CREATE",
      entityType: "Product",
      entityId: product.id,
      afterJson: product,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return product;
  }
}

import type { ProductRepository } from "../../domain/product/Product.repository.js";
import { NotFoundError } from "../../domain/shared/DomainError.js";

/** Devuelve todas las versiones (historial ALCOA+) de un producto, dado el id de cualquiera de sus versiones. */
export class GetProductHistoryUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(anyVersionId: string) {
    const anyVersion = await this.productRepository.findByIdAnyVersion(anyVersionId);
    if (!anyVersion) throw new NotFoundError("Product", anyVersionId);
    return this.productRepository.findHistoryByGroupId(anyVersion.productGroupId);
  }
}

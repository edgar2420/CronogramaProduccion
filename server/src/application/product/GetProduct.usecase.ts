import type { ProductRepository } from "../../domain/product/Product.repository.js";
import { NotFoundError } from "../../domain/shared/DomainError.js";

export class GetProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: string) {
    const product = await this.productRepository.findCurrentById(id);
    if (!product) throw new NotFoundError("Product", id);
    return product;
  }
}

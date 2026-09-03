import type { ListProductsFilter, ProductRepository } from "../../domain/product/Product.repository.js";

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(filter: ListProductsFilter) {
    return this.productRepository.list(filter);
  }
}

import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { Product } from "../../../domain/product/Product.entity.js";
import type {
  CreateProductData,
  ListProductsFilter,
  ListProductsResult,
  ProductRepository,
  ReviseProductData,
} from "../../../domain/product/Product.repository.js";
import { NotFoundError } from "../../../domain/shared/DomainError.js";

const DEFAULT_PAGE_SIZE = 50;

export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly client: PrismaClient) {}

  async findCurrentById(id: string): Promise<Product | null> {
    return this.client.product.findFirst({ where: { id, validTo: null } });
  }

  async findByIdAnyVersion(id: string): Promise<Product | null> {
    return this.client.product.findUnique({ where: { id } });
  }

  async findHistoryByGroupId(productGroupId: string): Promise<Product[]> {
    return this.client.product.findMany({
      where: { productGroupId },
      orderBy: { version: "asc" },
    });
  }

  async findCurrentByAreaAndCodigo(areaId: string, codigo: string): Promise<Product | null> {
    return this.client.product.findFirst({ where: { areaId, codigo, validTo: null } });
  }

  async list(filter: ListProductsFilter): Promise<ListProductsResult> {
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const pageSize = filter.pageSize && filter.pageSize > 0 ? filter.pageSize : DEFAULT_PAGE_SIZE;

    const where = {
      validTo: null,
      ...(filter.areaId ? { areaId: filter.areaId } : {}),
      ...(filter.activeOnly ? { active: true } : {}),
      ...(filter.search
        ? {
            OR: [
              { nombre: { contains: filter.search, mode: "insensitive" as const } },
              { codigo: { contains: filter.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.client.product.findMany({
        where,
        orderBy: [{ areaId: "asc" }, { codigo: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.client.product.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async create(data: CreateProductData): Promise<Product> {
    return this.client.product.create({
      data: {
        productGroupId: randomUUID(),
        version: 1,
        codigo: data.codigo,
        nombre: data.nombre,
        vol: data.vol ?? null,
        envase: data.envase ?? null,
        areaId: data.areaId,
        createdByUserId: data.createdByUserId,
      },
    });
  }

  async createRevision(currentId: string, data: ReviseProductData): Promise<Product> {
    return this.client.$transaction(async (tx) => {
      const current = await tx.product.findFirst({ where: { id: currentId, validTo: null } });
      if (!current) throw new NotFoundError("Product", currentId);

      const next = await tx.product.create({
        data: {
          productGroupId: current.productGroupId,
          version: current.version + 1,
          codigo: data.codigo ?? current.codigo,
          nombre: data.nombre ?? current.nombre,
          vol: data.vol !== undefined ? data.vol : current.vol,
          envase: data.envase !== undefined ? data.envase : current.envase,
          areaId: data.areaId ?? current.areaId,
          active: data.active !== undefined ? data.active : current.active,
          changeReason: data.changeReason,
          createdByUserId: data.createdByUserId,
        },
      });

      await tx.product.update({
        where: { id: current.id },
        data: { validTo: new Date(), supersededById: next.id },
      });

      return next;
    });
  }
}

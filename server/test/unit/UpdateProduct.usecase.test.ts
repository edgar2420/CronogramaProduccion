import { describe, expect, it, vi } from "vitest";
import { UpdateProductUseCase } from "../../src/application/product/UpdateProduct.usecase.js";
import type { ProductRepository } from "../../src/domain/product/Product.repository.js";
import type { AreaRepository } from "../../src/domain/area/Area.repository.js";
import type { AuditLogRepository } from "../../src/domain/audit/AuditLog.repository.js";
import type { Product } from "../../src/domain/product/Product.entity.js";
import { ValidationError } from "../../src/domain/shared/DomainError.js";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    productGroupId: "g1",
    version: 1,
    codigo: "01",
    nombre: "Solución Ringer Normal",
    vol: "1000 ml",
    envase: "Frasco infusor de PEBD Flex",
    areaId: "area1",
    active: true,
    validFrom: new Date("2026-01-01"),
    validTo: null,
    supersededById: null,
    changeReason: null,
    createdByUserId: "u1",
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

const actor = { userId: "u1", username: "admin", role: "admin" as const };

describe("UpdateProductUseCase", () => {
  it("exige changeReason y no llama al repositorio si falta", async () => {
    const productRepository = { findCurrentById: vi.fn(), createRevision: vi.fn() } as unknown as ProductRepository;
    const areaRepository = {} as AreaRepository;
    const auditLogRepository = { append: vi.fn() } as unknown as AuditLogRepository;

    const usecase = new UpdateProductUseCase(productRepository, areaRepository, auditLogRepository);

    await expect(
      usecase.execute("p1", { nombre: "Nuevo nombre", changeReason: "" }, actor)
    ).rejects.toBeInstanceOf(ValidationError);
    expect(productRepository.findCurrentById).not.toHaveBeenCalled();
  });

  it("crea una nueva versión y nunca muta la fila vigente en el mismo id", async () => {
    const current = makeProduct();
    const next = makeProduct({ id: "p2", version: 2, nombre: "Nombre corregido" });

    const productRepository = {
      findCurrentById: vi.fn().mockResolvedValue(current),
      createRevision: vi.fn().mockResolvedValue(next),
    } as unknown as ProductRepository;
    const areaRepository = {} as AreaRepository;
    const auditLogRepository = { append: vi.fn().mockResolvedValue(undefined) } as unknown as AuditLogRepository;

    const usecase = new UpdateProductUseCase(productRepository, areaRepository, auditLogRepository);
    const result = await usecase.execute(
      "p1",
      { nombre: "Nombre corregido", changeReason: "Corrección de ortografía" },
      actor
    );

    expect(result.id).toBe("p2");
    expect(result.version).toBe(2);
    expect(productRepository.createRevision).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ changeReason: "Corrección de ortografía", createdByUserId: "u1" })
    );
    expect(auditLogRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PRODUCT_UPDATE", beforeJson: current, afterJson: next })
    );
  });
});

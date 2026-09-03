import { describe, expect, it, vi } from "vitest";
import { RegisterRealUseCase } from "../../src/application/orden/RegisterReal.usecase.js";
import type { OrdenRepository } from "../../src/domain/orden/Orden.repository.js";
import type { AuditLogRepository } from "../../src/domain/audit/AuditLog.repository.js";
import type { Orden } from "../../src/domain/orden/Orden.entity.js";

function makeOrden(overrides: Partial<Orden> = {}): Orden {
  return {
    id: "o1",
    semanaId: "s1",
    areaId: "a1",
    fecha: new Date("2026-02-19"),
    turno: "manana",
    productId: "p1",
    tanqueId: null,
    opCode: null,
    planificado: "1000",
    real: null,
    observaciones: null,
    estado: "en_proceso",
    active: true,
    createdByUserId: "u1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const actor = { userId: "u1", username: "admin", role: "admin" as const };

describe("RegisterRealUseCase", () => {
  it("persiste observaciones (bug del frontend: hoy se descartaban)", async () => {
    const orden = makeOrden();
    const ordenRepository = {
      findById: vi.fn().mockResolvedValue(orden),
      registerReal: vi.fn().mockImplementation((_id, data) =>
        Promise.resolve({ ...orden, real: String(data.real), observaciones: data.observaciones, estado: data.estado })
      ),
    } as unknown as OrdenRepository;
    const auditLogRepository = { append: vi.fn() } as unknown as AuditLogRepository;

    const usecase = new RegisterRealUseCase(ordenRepository, auditLogRepository);
    const result = await usecase.execute("o1", { real: 500, observaciones: "faltó tapa a 3 unidades" }, actor);

    expect(result.observaciones).toBe("faltó tapa a 3 unidades");
    expect(ordenRepository.registerReal).toHaveBeenCalledWith(
      "o1",
      expect.objectContaining({ observaciones: "faltó tapa a 3 unidades" })
    );
  });

  it("transiciona a 'terminada' cuando real >= planificado, y no antes", async () => {
    const ordenRepository = {
      findById: vi.fn().mockResolvedValue(makeOrden({ planificado: "1000", estado: "en_proceso" })),
      registerReal: vi.fn().mockImplementation((_id, data) => Promise.resolve(makeOrden({ estado: data.estado }))),
    } as unknown as OrdenRepository;
    const auditLogRepository = { append: vi.fn() } as unknown as AuditLogRepository;
    const usecase = new RegisterRealUseCase(ordenRepository, auditLogRepository);

    await usecase.execute("o1", { real: 999 }, actor);
    expect(ordenRepository.registerReal).toHaveBeenCalledWith(
      "o1",
      expect.objectContaining({ estado: "en_proceso" })
    );

    await usecase.execute("o1", { real: 1000 }, actor);
    expect(ordenRepository.registerReal).toHaveBeenCalledWith(
      "o1",
      expect.objectContaining({ estado: "terminada" })
    );
  });

  it("rechaza real negativo sin tocar el repositorio", async () => {
    const ordenRepository = {
      findById: vi.fn(),
      registerReal: vi.fn(),
    } as unknown as OrdenRepository;
    const auditLogRepository = { append: vi.fn() } as unknown as AuditLogRepository;
    const usecase = new RegisterRealUseCase(ordenRepository, auditLogRepository);

    await expect(usecase.execute("o1", { real: -1 }, actor)).rejects.toThrow();
    expect(ordenRepository.findById).not.toHaveBeenCalled();
  });
});

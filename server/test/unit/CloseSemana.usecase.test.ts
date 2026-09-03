import { describe, expect, it, vi } from "vitest";
import { CloseSemanaUseCase } from "../../src/application/semana/CloseSemana.usecase.js";
import type { SemanaRepository } from "../../src/domain/semana/Semana.repository.js";
import type { OrdenRepository } from "../../src/domain/orden/Orden.repository.js";
import type { AuditLogRepository } from "../../src/domain/audit/AuditLog.repository.js";
import type { Clock } from "../../src/domain/shared/Clock.js";
import type { Semana } from "../../src/domain/semana/Semana.entity.js";
import { ConflictError } from "../../src/domain/shared/DomainError.js";

const actor = { userId: "u1", username: "admin", role: "admin" as const };

function makeSemana(overrides: Partial<Semana> = {}): Semana {
  return {
    id: "s1",
    areaId: "a1",
    fechaInicio: new Date("2026-02-19"),
    fechaFin: new Date("2026-02-25"),
    estado: "publicado",
    publishedAt: new Date(),
    publishedByUserId: "u1",
    closedAt: null,
    closedByUserId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("CloseSemanaUseCase", () => {
  it("rechaza cerrar si quedan órdenes en borrador", async () => {
    const semanaRepository = {
      findById: vi.fn().mockResolvedValue(makeSemana()),
      setEstado: vi.fn(),
    } as unknown as SemanaRepository;
    const ordenRepository = {
      countBorradorBySemana: vi.fn().mockResolvedValue(2),
    } as unknown as OrdenRepository;
    const auditLogRepository = { append: vi.fn() } as unknown as AuditLogRepository;
    const clock: Clock = { now: () => new Date("2026-03-01") };

    const usecase = new CloseSemanaUseCase(semanaRepository, ordenRepository, auditLogRepository, clock);
    await expect(usecase.execute("s1", actor)).rejects.toBeInstanceOf(ConflictError);
    expect(semanaRepository.setEstado).not.toHaveBeenCalled();
  });

  it("rechaza cerrar una semana que no está publicada", async () => {
    const semanaRepository = {
      findById: vi.fn().mockResolvedValue(makeSemana({ estado: "borrador" })),
      setEstado: vi.fn(),
    } as unknown as SemanaRepository;
    const ordenRepository = { countBorradorBySemana: vi.fn() } as unknown as OrdenRepository;
    const auditLogRepository = { append: vi.fn() } as unknown as AuditLogRepository;
    const clock: Clock = { now: () => new Date("2026-03-01") };

    const usecase = new CloseSemanaUseCase(semanaRepository, ordenRepository, auditLogRepository, clock);
    await expect(usecase.execute("s1", actor)).rejects.toBeInstanceOf(ConflictError);
  });

  it("cierra la semana cuando no hay pendientes", async () => {
    const semana = makeSemana();
    const semanaRepository = {
      findById: vi.fn().mockResolvedValue(semana),
      setEstado: vi.fn().mockResolvedValue({ ...semana, estado: "cerrado" }),
    } as unknown as SemanaRepository;
    const ordenRepository = { countBorradorBySemana: vi.fn().mockResolvedValue(0) } as unknown as OrdenRepository;
    const auditLogRepository = { append: vi.fn() } as unknown as AuditLogRepository;
    const clock: Clock = { now: () => new Date("2026-03-01") };

    const usecase = new CloseSemanaUseCase(semanaRepository, ordenRepository, auditLogRepository, clock);
    const result = await usecase.execute("s1", actor);
    expect(result.estado).toBe("cerrado");
    expect(auditLogRepository.append).toHaveBeenCalledWith(expect.objectContaining({ action: "SEMANA_CLOSE" }));
  });
});

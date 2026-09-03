import { describe, expect, it, vi } from "vitest";
import { AssignStaffUseCase } from "../../src/application/asignacion/AssignStaff.usecase.js";
import type { AsignacionRepository } from "../../src/domain/asignacion/Asignacion.repository.js";
import type { OrdenRepository } from "../../src/domain/orden/Orden.repository.js";
import type { StaffRepository } from "../../src/domain/staff/Staff.repository.js";
import type { AuditLogRepository } from "../../src/domain/audit/AuditLog.repository.js";
import type { Orden } from "../../src/domain/orden/Orden.entity.js";
import type { Staff } from "../../src/domain/staff/Staff.entity.js";
import type { AsignacionPersonal } from "../../src/domain/asignacion/Asignacion.entity.js";
import { ConflictError } from "../../src/domain/shared/DomainError.js";

const actor = { userId: "u1", username: "admin", role: "admin" as const };

function makeOrden(overrides: Partial<Orden> = {}): Orden {
  return {
    id: "o1",
    semanaId: "s1",
    areaId: "areaA",
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

function makeStaff(overrides: Partial<Staff> = {}): Staff {
  return {
    id: "st1",
    staffGroupId: "g1",
    version: 1,
    nombre: "Elvira Ramos",
    codigoEmpleado: null,
    rolBase: "Operador",
    areaIds: [],
    active: true,
    validFrom: new Date(),
    validTo: null,
    supersededById: null,
    changeReason: null,
    createdByUserId: "u1",
    createdAt: new Date(),
    ...overrides,
  };
}

describe("AssignStaffUseCase", () => {
  it("permite reasignar a la misma persona en la misma área (no es conflicto)", async () => {
    const orden = makeOrden({ areaId: "areaA" });
    const asignacionRepository = {
      findActiveByStaffFechaTurno: vi.fn().mockResolvedValue([
        { ordenId: "o2", areaId: "areaA" } as AsignacionPersonal,
      ]),
      create: vi.fn().mockResolvedValue({ id: "asig1" }),
    } as unknown as AsignacionRepository;
    const ordenRepository = { findById: vi.fn().mockResolvedValue(orden) } as unknown as OrdenRepository;
    const staffRepository = { findCurrentById: vi.fn().mockResolvedValue(makeStaff()) } as unknown as StaffRepository;
    const auditLogRepository = { append: vi.fn() } as unknown as AuditLogRepository;

    const usecase = new AssignStaffUseCase(asignacionRepository, ordenRepository, staffRepository, auditLogRepository);
    await expect(
      usecase.execute({ ordenId: "o1", staffId: "st1", rolOperativo: "Operador bidones" }, actor)
    ).resolves.toEqual({ id: "asig1" });
  });

  it("bloquea si la persona ya está asignada ese turno en OTRA área (cruzando semanas)", async () => {
    const orden = makeOrden({ areaId: "areaA" });
    const asignacionRepository = {
      findActiveByStaffFechaTurno: vi.fn().mockResolvedValue([
        { ordenId: "o-de-otra-semana", areaId: "areaB" } as AsignacionPersonal,
      ]),
      create: vi.fn(),
    } as unknown as AsignacionRepository;
    const ordenRepository = { findById: vi.fn().mockResolvedValue(orden) } as unknown as OrdenRepository;
    const staffRepository = { findCurrentById: vi.fn().mockResolvedValue(makeStaff()) } as unknown as StaffRepository;
    const auditLogRepository = { append: vi.fn() } as unknown as AuditLogRepository;

    const usecase = new AssignStaffUseCase(asignacionRepository, ordenRepository, staffRepository, auditLogRepository);
    await expect(
      usecase.execute({ ordenId: "o1", staffId: "st1", rolOperativo: "Operador bidones" }, actor)
    ).rejects.toBeInstanceOf(ConflictError);
    expect(asignacionRepository.create).not.toHaveBeenCalled();
  });
});

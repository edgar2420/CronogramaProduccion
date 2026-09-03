import type { StaffRepository } from "../../domain/staff/Staff.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { assertValidStaffInput, type RolBaseStaff } from "../../domain/staff/Staff.entity.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface CreateStaffInput {
  nombre: string;
  codigoEmpleado?: string | null;
  rolBase: RolBaseStaff;
  areaIds: string[];
}

export class CreateStaffUseCase {
  constructor(
    private readonly staffRepository: StaffRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(input: CreateStaffInput, actor: ActorContext) {
    assertValidStaffInput(input);

    const staff = await this.staffRepository.create({
      nombre: input.nombre,
      codigoEmpleado: input.codigoEmpleado ?? null,
      rolBase: input.rolBase,
      areaIds: input.areaIds,
      createdByUserId: actor.userId,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "STAFF_CREATE",
      entityType: "Staff",
      entityId: staff.id,
      afterJson: staff,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return staff;
  }
}

import type { StaffRepository } from "../../domain/staff/Staff.repository.js";
import type { SkillsMap } from "../../domain/staff/Staff.entity.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { NotFoundError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export class UpdateStaffSkillsUseCase {
  constructor(
    private readonly staffRepository: StaffRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(id: string, skills: SkillsMap, actor: ActorContext) {
    const before = await this.staffRepository.findCurrentById(id);
    if (!before) throw new NotFoundError("Staff", id);

    const after = await this.staffRepository.updateSkills(id, skills);

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "STAFF_SKILLS_UPDATE",
      entityType: "Staff",
      entityId: id,
      beforeJson: { skills: before.skills },
      afterJson: { skills: after.skills },
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return after;
  }
}

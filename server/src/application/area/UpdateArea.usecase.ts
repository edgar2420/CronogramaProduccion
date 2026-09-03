import type { AreaRepository } from "../../domain/area/Area.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { NotFoundError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface UpdateAreaInput {
  name?: string;
  colorHex?: string | null;
}

export class UpdateAreaUseCase {
  constructor(
    private readonly areaRepository: AreaRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(id: string, input: UpdateAreaInput, actor: ActorContext) {
    const before = await this.areaRepository.findById(id);
    if (!before) throw new NotFoundError("Area", id);

    const after = await this.areaRepository.update(id, input);

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "AREA_UPDATE",
      entityType: "Area",
      entityId: id,
      beforeJson: before,
      afterJson: after,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return after;
  }
}

export class SetAreaActiveUseCase {
  constructor(
    private readonly areaRepository: AreaRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(id: string, active: boolean, actor: ActorContext) {
    const before = await this.areaRepository.findById(id);
    if (!before) throw new NotFoundError("Area", id);

    const after = await this.areaRepository.setActive(id, active);

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: active ? "AREA_ACTIVATE" : "AREA_DEACTIVATE",
      entityType: "Area",
      entityId: id,
      beforeJson: before,
      afterJson: after,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return after;
  }
}

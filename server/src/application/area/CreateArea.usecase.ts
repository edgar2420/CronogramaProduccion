import type { AreaRepository } from "../../domain/area/Area.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { ConflictError, ValidationError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface CreateAreaInput {
  code: string;
  name: string;
  colorHex?: string | null;
}

export class CreateAreaUseCase {
  constructor(
    private readonly areaRepository: AreaRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(input: CreateAreaInput, actor: ActorContext) {
    if (!input.code?.trim() || !input.name?.trim()) {
      throw new ValidationError("code y name son obligatorios");
    }
    const existing = await this.areaRepository.findByCode(input.code);
    if (existing) {
      throw new ConflictError(`Ya existe un área con el código ${input.code}`);
    }

    const area = await this.areaRepository.create(input);

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "AREA_CREATE",
      entityType: "Area",
      entityId: area.id,
      afterJson: area,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return area;
  }
}

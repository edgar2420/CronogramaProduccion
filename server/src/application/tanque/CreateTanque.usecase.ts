import type { TanqueRepository } from "../../domain/tanque/Tanque.repository.js";
import type { AreaRepository } from "../../domain/area/Area.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { ConflictError, NotFoundError, ValidationError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface CreateTanqueInput {
  code: string;
  areaId: string;
}

export class CreateTanqueUseCase {
  constructor(
    private readonly tanqueRepository: TanqueRepository,
    private readonly areaRepository: AreaRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(input: CreateTanqueInput, actor: ActorContext) {
    if (!input.code?.trim()) throw new ValidationError("code es obligatorio");

    const area = await this.areaRepository.findById(input.areaId);
    if (!area) throw new NotFoundError("Area", input.areaId);

    const existing = await this.tanqueRepository.findByCode(input.code);
    if (existing) throw new ConflictError(`Ya existe un tanque con código ${input.code}`);

    const tanque = await this.tanqueRepository.create(input);

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "TANQUE_CREATE",
      entityType: "Tanque",
      entityId: tanque.id,
      afterJson: tanque,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return tanque;
  }
}

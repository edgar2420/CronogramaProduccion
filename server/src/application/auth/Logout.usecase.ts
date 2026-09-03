import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import type { ActorContext } from "../shared/ActorContext.js";

/**
 * Los access tokens son JWT sin estado y expiran solos (TTL corto); esta
 * fase no mantiene una lista de revocación. Logout limpia la cookie de
 * refresh token en el controlador y deja constancia en auditoría.
 */
export class LogoutUseCase {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async execute(actor: ActorContext) {
    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "LOGOUT",
      entityType: "User",
      entityId: actor.userId,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });
  }
}

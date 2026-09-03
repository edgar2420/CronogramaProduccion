import type { UserRepository } from "../../domain/user/User.repository.js";
import type { PasswordHasher } from "../../domain/user/PasswordHasher.js";
import type { Role } from "../../domain/user/User.entity.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { NotFoundError, ValidationError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";
import { toPublicUser } from "../../domain/user/User.entity.js";

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  active?: boolean;
  /** Si se manda, resetea la contraseña (ej. "olvidé mi contraseña" hecho por un superadmin). */
  password?: string;
}

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(id: string, input: UpdateUserInput, actor: ActorContext) {
    const before = await this.userRepository.findById(id);
    if (!before) throw new NotFoundError("User", id);

    let passwordHash: string | undefined;
    if (input.password !== undefined) {
      if (input.password.length < 8) {
        throw new ValidationError("La contraseña debe tener al menos 8 caracteres");
      }
      passwordHash = await this.passwordHasher.hash(input.password);
    }

    const after = await this.userRepository.update(id, {
      name: input.name,
      role: input.role,
      active: input.active,
      passwordHash,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: passwordHash ? "USER_UPDATE_PASSWORD_RESET" : "USER_UPDATE",
      entityType: "User",
      entityId: id,
      // Nunca se audita el hash de contraseña, ni antes ni después.
      beforeJson: toPublicUser(before),
      afterJson: toPublicUser(after),
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return toPublicUser(after);
  }
}

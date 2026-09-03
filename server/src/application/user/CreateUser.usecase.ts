import type { UserRepository } from "../../domain/user/User.repository.js";
import type { PasswordHasher } from "../../domain/user/PasswordHasher.js";
import type { Role } from "../../domain/user/User.entity.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { ConflictError, ValidationError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";
import { toPublicUser } from "../../domain/user/User.entity.js";

export interface CreateUserInput {
  username: string;
  name: string;
  role: Role;
  password: string;
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(input: CreateUserInput, actor: ActorContext) {
    if (input.password.length < 8) {
      throw new ValidationError("La contraseña debe tener al menos 8 caracteres");
    }
    const existing = await this.userRepository.findByUsername(input.username);
    if (existing) throw new ConflictError(`Ya existe un usuario con el nombre "${input.username}"`);

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({
      username: input.username,
      name: input.name,
      role: input.role,
      passwordHash,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "USER_CREATE",
      entityType: "User",
      entityId: user.id,
      afterJson: toPublicUser(user),
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return toPublicUser(user);
  }
}

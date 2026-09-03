import type { UserRepository } from "../../domain/user/User.repository.js";
import type { PasswordHasher } from "../../domain/user/PasswordHasher.js";
import type { TokenService } from "../../domain/user/TokenService.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import type { Clock } from "../../domain/shared/Clock.js";
import { UnauthorizedError } from "../../domain/shared/DomainError.js";
import { toPublicUser } from "../../domain/user/User.entity.js";

export interface LoginInput {
  username: string;
  password: string;
  ipAddress?: string | null;
  requestId?: string | null;
}

export interface LoginConfig {
  maxFailedAttempts: number;
  lockoutMinutes: number;
}

/**
 * Login con bloqueo de cuenta tras N intentos fallidos. Cada intento (exitoso
 * o fallido) queda en audit_log con timestamp de servidor — nunca del cliente.
 */
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly clock: Clock,
    private readonly config: LoginConfig
  ) {}

  async execute(input: LoginInput) {
    const user = await this.userRepository.findByUsername(input.username);

    if (!user || !user.active) {
      await this.auditLogRepository.append({
        actorUserId: user?.id ?? null,
        actorUsername: input.username,
        action: "LOGIN_FAIL_UNKNOWN_USER",
        entityType: "User",
        entityId: user?.id ?? "unknown",
        ipAddress: input.ipAddress ?? null,
        requestId: input.requestId ?? null,
      });
      throw new UnauthorizedError("Usuario o contraseña incorrectos");
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > this.clock.now().getTime()) {
      await this.auditLogRepository.append({
        actorUserId: user.id,
        actorUsername: user.username,
        action: "LOGIN_BLOCKED_LOCKED",
        entityType: "User",
        entityId: user.id,
        ipAddress: input.ipAddress ?? null,
        requestId: input.requestId ?? null,
      });
      throw new UnauthorizedError("Cuenta bloqueada temporalmente por intentos fallidos. Intenta más tarde.");
    }

    const valid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!valid) {
      const failedCount = user.failedLoginCount + 1;
      const shouldLock = failedCount >= this.config.maxFailedAttempts;
      const lockedUntil = shouldLock
        ? new Date(this.clock.now().getTime() + this.config.lockoutMinutes * 60_000)
        : null;

      await this.userRepository.incrementFailedLogin(user.id, lockedUntil);
      await this.auditLogRepository.append({
        actorUserId: user.id,
        actorUsername: user.username,
        action: shouldLock ? "LOGIN_FAIL_NOW_LOCKED" : "LOGIN_FAIL_BAD_PASSWORD",
        entityType: "User",
        entityId: user.id,
        ipAddress: input.ipAddress ?? null,
        requestId: input.requestId ?? null,
      });
      throw new UnauthorizedError("Usuario o contraseña incorrectos");
    }

    await this.userRepository.resetFailedLogin(user.id);

    const payload = { userId: user.id, username: user.username, role: user.role };
    const accessToken = this.tokenService.signAccessToken(payload);
    const refreshToken = this.tokenService.signRefreshToken(payload);

    await this.auditLogRepository.append({
      actorUserId: user.id,
      actorUsername: user.username,
      action: "LOGIN_SUCCESS",
      entityType: "User",
      entityId: user.id,
      ipAddress: input.ipAddress ?? null,
      requestId: input.requestId ?? null,
    });

    return { accessToken, refreshToken, user: toPublicUser(user) };
  }
}

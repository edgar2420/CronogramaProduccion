import type { UserRepository } from "../../domain/user/User.repository.js";
import type { TokenService } from "../../domain/user/TokenService.js";
import { UnauthorizedError } from "../../domain/shared/DomainError.js";

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService
  ) {}

  async execute(refreshToken: string) {
    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Refresh token inválido o expirado");
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.active) {
      throw new UnauthorizedError("Usuario no válido");
    }

    const newPayload = { userId: user.id, username: user.username, role: user.role };
    return {
      accessToken: this.tokenService.signAccessToken(newPayload),
      refreshToken: this.tokenService.signRefreshToken(newPayload),
    };
  }
}

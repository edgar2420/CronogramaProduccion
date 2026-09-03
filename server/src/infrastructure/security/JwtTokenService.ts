import jwt, { type SignOptions } from "jsonwebtoken";
import type { TokenPair, TokenPayload, TokenService } from "../../domain/user/TokenService.js";

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTtl: string;
  refreshTtl: string;
}

export class JwtTokenService implements TokenService {
  constructor(private readonly config: JwtConfig) {}

  signAccessToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: this.config.accessTtl as SignOptions["expiresIn"] };
    return jwt.sign(payload, this.config.accessSecret, options);
  }

  signRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: this.config.refreshTtl as SignOptions["expiresIn"] };
    return jwt.sign(payload, this.config.refreshSecret, options);
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.config.accessSecret) as unknown as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.config.refreshSecret) as unknown as TokenPayload;
  }
}

export type { TokenPair };

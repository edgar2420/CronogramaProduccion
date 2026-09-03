import bcrypt from "bcryptjs";
import type { PasswordHasher } from "../../domain/user/PasswordHasher.js";

const COST_FACTOR = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, COST_FACTOR);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}

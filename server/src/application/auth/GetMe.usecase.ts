import type { UserRepository } from "../../domain/user/User.repository.js";
import { NotFoundError } from "../../domain/shared/DomainError.js";
import { toPublicUser } from "../../domain/user/User.entity.js";

export class GetMeUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("User", userId);
    return toPublicUser(user);
  }
}

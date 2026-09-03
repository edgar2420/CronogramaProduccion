import type { UserRepository } from "../../domain/user/User.repository.js";
import { toPublicUser } from "../../domain/user/User.entity.js";

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute() {
    const users = await this.userRepository.findAll();
    return users.map(toPublicUser);
  }
}

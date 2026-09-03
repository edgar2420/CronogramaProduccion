import type { ListStaffFilter, StaffRepository } from "../../domain/staff/Staff.repository.js";

export class ListStaffUseCase {
  constructor(private readonly staffRepository: StaffRepository) {}

  async execute(filter: ListStaffFilter) {
    return this.staffRepository.list(filter);
  }
}

import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import type { NewAuditEntry } from "../../domain/audit/AuditEntry.entity.js";

export class RecordAuditEntryUseCase {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async execute(entry: NewAuditEntry) {
    return this.auditLogRepository.append(entry);
  }
}

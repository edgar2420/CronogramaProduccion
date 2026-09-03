import type { PrismaClient } from "@prisma/client";
import type { AuditLogRepository } from "../../../domain/audit/AuditLog.repository.js";
import type { NewAuditEntry } from "../../../domain/audit/AuditEntry.entity.js";

/**
 * Único punto de escritura de audit_log. Deliberadamente no implementa
 * update/delete — no existen en la interfaz AuditLogRepository. La tabla
 * subyacente además rechaza UPDATE/DELETE a nivel de Postgres
 * (ver prisma/sql/audit_log_immutable.sql).
 */
export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly client: PrismaClient) {}

  async append(entry: NewAuditEntry) {
    return this.client.auditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        actorUsername: entry.actorUsername,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        beforeJson: entry.beforeJson === undefined ? undefined : (entry.beforeJson as object),
        afterJson: entry.afterJson === undefined ? undefined : (entry.afterJson as object),
        ipAddress: entry.ipAddress ?? null,
        requestId: entry.requestId ?? null,
      },
    });
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.client.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { occurredAt: "asc" },
    });
  }
}

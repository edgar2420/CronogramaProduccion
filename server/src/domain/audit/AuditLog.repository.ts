import type { AuditEntry, NewAuditEntry } from "./AuditEntry.entity.js";

/**
 * Puerto de auditoría: deliberadamente solo expone append(). No hay
 * update()/delete() en esta interfaz — la inmutabilidad es un invariante de
 * tipo, reforzado además a nivel de base de datos (ver prisma/sql/audit_log_immutable.sql).
 */
export interface AuditLogRepository {
  append(entry: NewAuditEntry): Promise<AuditEntry>;
  findByEntity(entityType: string, entityId: string): Promise<AuditEntry[]>;
}

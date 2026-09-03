export interface AuditEntry {
  id: string;
  occurredAt: Date;
  actorUserId: string | null;
  actorUsername: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: unknown;
  afterJson: unknown;
  ipAddress: string | null;
  requestId: string | null;
}

export interface NewAuditEntry {
  actorUserId: string | null;
  actorUsername: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  ipAddress?: string | null;
  requestId?: string | null;
}

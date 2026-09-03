-- Hace que audit_log sea de solo-inserción a nivel de base de datos.
-- Ejecutar DESPUÉS de la migración inicial (una vez que la tabla audit_log existe):
--   npx prisma db execute --file ./prisma/sql/audit_log_immutable.sql --schema ./prisma/schema.prisma
--
-- Defensa en profundidad: aunque el código de aplicación (PrismaAuditLogRepository)
-- solo expone un método append(), esta regla bloquea también un UPDATE/DELETE
-- ejecutado directamente contra la base (acceso manual, otra herramienta, etc.).

DROP RULE IF EXISTS audit_log_no_update ON audit_log;
DROP RULE IF EXISTS audit_log_no_delete ON audit_log;

CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- Si el rol de la aplicación es distinto del owner de la tabla, además revocar
-- explícitamente los permisos (ajustar el nombre de rol al de tu .env):
-- REVOKE UPDATE, DELETE ON audit_log FROM cronograma_app;

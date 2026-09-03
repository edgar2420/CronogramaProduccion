# Seguridad y continuidad

Estado de los controles de seguridad del backend del Cronograma de Producción.
Cada punto dice **dónde está implementado** y **cómo se verifica**, para que sirva
de evidencia en una calificación (OQ) y no solo de declaración.

## 1. Transporte cifrado (HTTPS/TLS)

`src/config/env.ts` **rechaza el arranque en producción** si no hay HTTPS. Hay dos
formas válidas y hay que declarar una:

| Modo | Variables | Cuándo |
|---|---|---|
| TLS en el proceso | `TLS_ENABLED=true` + `TLS_KEY_PATH` + `TLS_CERT_PATH` (+ `TLS_CA_PATH`) | El servidor Node atiende HTTPS directo |
| TLS en el proxy | `TLS_TERMINATED_BY_PROXY=true` + `TRUST_PROXY_HOPS` | Nginx / balanceador / ingress ya descifró |

- Piso de protocolo **TLS 1.2** y orden de suites del servidor (`server.ts`).
- Con TLS en el proxy, `app.ts` **rechaza con 403** toda petición que no llegue
  como HTTPS (`req.secure` vía `X-Forwarded-Proto`). No redirige: una API con
  cookies no debe reenviar credenciales por texto plano.
- **HSTS** `max-age=63072000; includeSubDomains; preload` (2 años).

Certificado de desarrollo: `node scripts/generar-certificado-dev.mjs`.
No sirve para producción; ahí va un certificado de una CA real, con renovación
antes del vencimiento.

Verificado el 03/09/2026: el servidor sirve `https://localhost:4443/health` → 200
con la cabecera HSTS presente; producción sin TLS no arranca.

## 2. OWASP Top 10

| Riesgo | Control | Dónde |
|---|---|---|
| A01 Control de acceso roto | RBAC en el servidor con `requireRole()` en cada ruta de escritura; el frontend nunca es la única barrera | `middlewares/rbac.middleware.ts` |
| A02 Fallos criptográficos | bcrypt para contraseñas; TLS obligatorio; JWT firmados con secretos de ≥32 caracteres validados al arrancar | `BcryptPasswordHasher`, `env.ts` |
| A03 Inyección | Prisma con consultas parametrizadas; zod valida todo cuerpo y query; `query parser: simple` evita contaminación de parámetros | `dto/*.ts`, `app.ts` |
| A04 Diseño inseguro | Versionado inmutable y bajas lógicas: no hay `DELETE` físico en el dominio | `application/**` |
| A05 Mala configuración | `helmet` con CSP `default-src 'none'`, `x-powered-by` desactivado, CORS con allowlist explícita, `Cache-Control: no-store` en `/api` | `app.ts` |
| A06 Componentes vulnerables | `npm audit` en cada cambio de dependencias (ver control de cambios) | — |
| A07 Fallos de identificación | Bloqueo de cuenta tras `LOGIN_MAX_FAILED_ATTEMPTS`; rate limit de login; refresh token en cookie `httpOnly`+`secure`+`sameSite=strict` acotada a `/api/v1/auth` | `Login.usecase.ts`, `auth.controller.ts` |
| A08 Integridad de datos | `audit_log` append-only por reglas de Postgres; timestamps del servidor, nunca del cliente | `prisma/sql/audit_log_immutable.sql` |
| A09 Fallos de registro | Todo cambio genera una fila de auditoría con actor, acción, entidad, antes/después y `requestId` | `RecordAuditEntry.usecase.ts` |
| A10 SSRF | El backend no hace peticiones salientes a URLs suministradas por el usuario | — |

### CORS

`CORS_ORIGIN` acepta una lista separada por comas. Un origen fuera de la lista
recibe **403** explícito (no un 500), tanto en la petición como en el preflight.
En producción `*` está prohibido: el API usa cookies de sesión.

Verificado: origen permitido → pasa con `Access-Control-Allow-Origin`; origen no
permitido → 403 `ORIGEN_NO_PERMITIDO`; preflight bloqueado → 403.

### Límites

- Cuerpo JSON: 1 MB.
- Rate limit global: 300 peticiones/minuto.
- Rate limit de login: 20 intentos / 15 minutos, además del bloqueo de cuenta.

## 3. Respaldos y recuperación

```bash
npm run backup            # respaldo + sha256 + verificación + retención
npm run restore -- --archivo backups/<archivo>.dump            # muestra qué haría
npm run restore -- --archivo backups/<archivo>.dump --confirmar
npm run restore:ensayo -- --archivo backups/<archivo>.dump --confirmar   # simulacro
```

- Formato **custom de `pg_dump`** (`-Fc`), que permite restauración selectiva.
- Cada respaldo lleva su **`.sha256`**; la restauración lo verifica y **aborta** si
  no coincide. Sin esa prueba no se puede afirmar que el dato no se alteró.
- Cada respaldo se **verifica al crearse** con `pg_restore --list`: si el archivo
  no es legible se descarta en el momento, no el día que haga falta.
- **Retención** configurable (`BACKUP_RETENTION_DAYS`, 30 por defecto).
- `backups/bitacora.log` registra fecha, archivo, tamaño y hash de cada corrida.
- Tras restaurar, las reglas de inmutabilidad del `audit_log` **se reaplican
  automáticamente** (`--clean` recrea las tablas y se las llevaría puestas), y la
  restauración falla si no quedaron activas.

**Simulacro ejecutado el 03/09/2026**: restauración completa sobre
`cronograma_produccion_ensayo` desde un respaldo verificado → 375 órdenes,
143 productos, 894 filas de auditoría, `audit_log` protegido. La base productiva
no se tocó.

### Programación

El respaldo no se agenda solo. Hay que dejarlo programado en el servidor:

- **Linux**: `0 2 * * * cd /ruta/server && npm run backup >> backups/cron.log 2>&1`
- **Windows**: Programador de tareas, diario, acción
  `node C:\ruta\server\scripts\backup-db.mjs`

Los respaldos deben copiarse **fuera del servidor** (otro disco o sitio): un
respaldo en la misma máquina no protege de la pérdida de la máquina.

## 4. Pendiente

- **2FA/MFA** en el login. El resto de los controles de identificación está, pero
  el segundo factor todavía no.
- Rotación programada de los secretos JWT.
- Copia de los respaldos a un destino externo (hoy es un paso manual).

# Control de cambios

Todo cambio al sistema pasa por acá. El objetivo es que, ante una inspección, se
pueda reconstruir **qué cambió, por qué, quién lo aprobó y cómo se verificó**.

## 1. Clasificación por riesgo (GAMP 5)

El sistema es **categoría 5** (software desarrollado a medida), así que todo
cambio se evalúa. El nivel define cuánta verificación hace falta:

| Nivel | Qué es | Ejemplos | Requiere |
|---|---|---|---|
| **Mayor** | Afecta datos de lote, auditoría, permisos o el cálculo de lo planificado/cumplido | Cambiar el modelo `Orden`, tocar el `audit_log`, modificar RBAC, cambiar el parser de cronogramas | Evaluación de impacto + pruebas + re-calificación (OQ/PQ) del área afectada + aprobación de Calidad antes de producción |
| **Menor** | No toca datos GxP ni permisos | Textos, colores, orden de columnas, mejoras de rendimiento sin cambio de lógica | Pruebas automatizadas en verde + revisión de código |
| **Correctivo urgente** | Falla en producción que impide operar | Caída del servicio, error que bloquea el registro | Se aplica y se documenta **dentro de las 24 h siguientes**, con la misma evaluación que un cambio mayor |

Si hay duda sobre el nivel, se trata como **mayor**.

## 2. Flujo

1. **Solicitud** — issue o ticket con: qué se pide, por qué, quién lo pide.
2. **Evaluación de impacto** — nivel de riesgo, qué datos toca, si hace falta
   migración, si afecta registros ya existentes.
3. **Implementación** — en una rama, nunca directo sobre `main`.
4. **Verificación** — ver §3.
5. **Aprobación** — un cambio mayor necesita el visto bueno de Calidad **antes**
   de llegar a producción.
6. **Despliegue** — ver §4.
7. **Cierre** — el commit referencia el ticket; el `CHANGELOG` deja la entrada.

## 3. Verificación mínima antes de aprobar

```bash
cd server
npm test              # pruebas unitarias
npx tsc --noEmit      # tipos
npm audit             # dependencias vulnerables
```

Además, según lo que toque el cambio:

| Si el cambio toca… | Verificar también |
|---|---|
| El esquema de la base | Que la migración aplica sobre una **copia restaurada de producción**, no sobre una base vacía |
| El `audit_log` | Que `UPDATE` y `DELETE` directos siguen sin efecto (`npm run db:proteger-audit` lo comprueba) |
| Permisos o RBAC | Que cada rol recibe 403 donde corresponde |
| Autenticación | Bloqueo de cuenta, rate limit y expiración del token |
| El parser de cronogramas | Las pruebas con planillas reales de los cuatro layouts |
| Configuración de seguridad | Los controles de `docs/SEGURIDAD.md` |

## 4. Despliegue

1. **Respaldo previo obligatorio**: `npm run backup`. Sin respaldo verificado no
   se despliega.
2. Aplicar migraciones: `npm run prisma:migrate:deploy`.
3. Reaplicar la protección del audit trail: `npm run db:proteger-audit`.
   Es un paso propio a propósito: si una migración recreó la tabla, las reglas
   se fueron con ella.
4. Verificar que el servicio responde y que las cabeceras de seguridad están.
5. Registrar el despliegue: fecha, versión (hash de commit), quién lo hizo.

### Reversión

Si el despliegue falla:

1. Volver al commit anterior.
2. Si hubo migración destructiva, restaurar el respaldo del paso 1:
   `npm run restore -- --archivo backups/<el del paso 1>.dump --confirmar`
3. Registrar qué pasó y por qué se revirtió. **Una reversión también es un
   cambio**: se documenta igual.

## 5. Migraciones de base de datos

- Se versionan en `prisma/migrations/` y se aplican con
  `prisma:migrate:deploy` (nunca `migrate dev` en producción: puede resetear).
- **Nunca** una migración que borre o sobrescriba datos históricos de lote. Si un
  campo deja de usarse, se marca obsoleto; no se elimina la columna con datos.
- Toda migración se prueba antes sobre una copia restaurada de producción.

## 6. Qué queda registrado automáticamente

No hace falta anotarlo a mano; el sistema ya lo guarda:

- **`audit_log`** (append-only): cada creación, modificación, publicación,
  cierre, asignación y cancelación, con actor, marca de tiempo del servidor,
  estado anterior y posterior, IP y `requestId`.
- **Versionado inmutable** de productos, personal y capacidades: editar inserta
  una versión nueva y cierra la anterior con `validTo`, conservando el
  `changeReason`.
- **`backups/bitacora.log`**: cada respaldo con su hash.
- **Historial de git**: cada cambio de código con autor y fecha.

## 7. Registro de cambios mayores

| Fecha | Cambio | Nivel | Verificación | Aprobó |
|---|---|---|---|---|
| 02/09/2026 | Backend hexagonal inicial: productos, áreas, auth, RBAC, audit trail inmutable | Mayor | Pruebas unitarias + verificación end-to-end de RBAC, bloqueo de cuenta y versionado | _pendiente_ |
| 03/09/2026 | Modelo `Orden` extendido con los campos del registro de fabricación (Nº lote, O.P., correlativos, vencimiento, volúmenes, cancelación) | Mayor | Migración `20260903112327`; 30 pruebas en verde | _pendiente_ |
| 03/09/2026 | Importación de los cronogramas reales de las 7 áreas (375 órdenes) | Mayor | Importador idempotente por Nº de lote; hallazgos en `AUDITORIA-DATOS.md` sin corregir datos por cuenta propia | _pendiente_ |
| 03/09/2026 | HTTPS obligatorio, hardening OWASP, respaldos automáticos y simulacro de recuperación | Mayor | Ver `docs/SEGURIDAD.md`; simulacro de restauración ejecutado | _pendiente_ |

> Las aprobaciones de Calidad quedan pendientes de firma. La firma electrónica
> con validez legal (21 CFR Part 11 §11.100) todavía no está implementada en el
> sistema; hasta entonces, la aprobación se registra en papel y se referencia acá.

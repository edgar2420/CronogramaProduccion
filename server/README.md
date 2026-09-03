# Backend — Cronograma de Producción (Fase 1: Productos)

Arquitectura hexagonal (dominio / aplicación / infraestructura / interfaces) sobre Node.js + TypeScript + Express + PostgreSQL (Prisma). Ver el plan completo en `../` (documento de planificación) para el contexto regulatorio (CSV, 21 CFR Part 11, ALCOA+) que motiva las decisiones de este módulo.

## Requisitos

- Node.js 20+
- Docker Desktop (para Postgres local vía `docker-compose.yml`)

## Puesta en marcha (primera vez)

```bash
cd server
cp .env.example .env
# Edita .env: genera JWT_ACCESS_SECRET/JWT_REFRESH_SECRET (64+ caracteres aleatorios),
# define SEED_SUPERADMIN_PASSWORD, ajusta POSTGRES_PASSWORD.

docker compose up -d postgres      # levanta solo la base de datos
npm install
npm run prisma:generate
npm run prisma:migrate             # crea las tablas (te pedirá un nombre, usa "init")
npx prisma db execute --file ./prisma/sql/audit_log_immutable.sql --schema ./prisma/schema.prisma
npm run prisma:seed                # crea las áreas, ~120 productos reales y el usuario superadmin

npm run dev                        # arranca la API en http://localhost:4000
```

`GET /health` debe responder `{ "status": "ok" }`.

## Por qué el orden importa

1. `prisma:migrate` genera las tablas a partir de `prisma/schema.prisma` (incluye `audit_log`).
2. Solo después de que `audit_log` existe se puede aplicar `audit_log_immutable.sql`, que agrega las reglas de Postgres que bloquean `UPDATE`/`DELETE` directos sobre esa tabla (defensa en profundidad, además de que el código de aplicación solo expone `append()`).
3. El seed usa el usuario superadmin como `createdByUserId` de los productos migrados desde `catalogoProductos.ts` del frontend, así que debe correr al final.

## Pruebas

```bash
npm test                # unitarias (dominio/aplicación, sin DB)
npx vitest run test/integration   # requiere una base de datos de pruebas ya migrada
```

## Producción / Docker completo

`docker-compose.yml` también define el servicio `api` (build multi-stage desde `Dockerfile`). Antes de usarlo en un entorno real:

- Reemplaza los secretos de `.env` por valores generados para ese entorno (nunca reutilices los de desarrollo).
- Sirve la API detrás de un proxy/balanceador con TLS (HTTPS) — este servidor no termina TLS por sí mismo.
- Configura backups automáticos del volumen/instancia de Postgres y prueba una restauración antes de considerar el sistema en producción (Fase 5 del roadmap).

## Endpoints (Fase 1)

Ver el plan para la lista completa. Todos los endpoints autenticados requieren `Authorization: Bearer <accessToken>` obtenido de `POST /api/v1/auth/login`.

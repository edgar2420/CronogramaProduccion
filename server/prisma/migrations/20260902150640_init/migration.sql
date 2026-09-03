-- CreateEnum
CREATE TYPE "Role" AS ENUM ('superadmin', 'admin', 'usuario');

-- CreateEnum
CREATE TYPE "RolBaseStaff" AS ENUM ('Operador', 'Supervisor', 'Tecnologo');

-- CreateEnum
CREATE TYPE "EstadoSemana" AS ENUM ('borrador', 'publicado', 'cerrado');

-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('borrador', 'en_proceso', 'terminada');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('manana', 'tarde', 'noche');

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colorHex" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "productGroupId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "vol" TEXT,
    "envase" TEXT,
    "areaId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "supersededById" TEXT,
    "changeReason" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'usuario',
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "staffGroupId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "nombre" TEXT NOT NULL,
    "codigoEmpleado" TEXT,
    "rolBase" "RolBaseStaff" NOT NULL,
    "areaIds" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "supersededById" TEXT,
    "changeReason" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tanques" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tanques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacidad_producto_tanque" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "productId" TEXT NOT NULL,
    "tanqueId" TEXT NOT NULL,
    "volumenUnitarioMl" DECIMAL(65,30) NOT NULL,
    "volumenAValidarL" DECIMAL(65,30) NOT NULL,
    "lotesProgramadosDia" DECIMAL(65,30) NOT NULL,
    "cantidadTeoricaDia" DECIMAL(65,30) NOT NULL,
    "horasEnvasado" DECIMAL(65,30),
    "horasAnalisis" DECIMAL(65,30),
    "observaciones" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "supersededById" TEXT,
    "changeReason" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capacidad_producto_tanque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semanas" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoSemana" NOT NULL DEFAULT 'borrador',
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "semanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes" (
    "id" TEXT NOT NULL,
    "semanaId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "turno" "Turno" NOT NULL,
    "productId" TEXT NOT NULL,
    "tanqueId" TEXT,
    "opCode" TEXT,
    "planificado" DECIMAL(65,30) NOT NULL,
    "real" DECIMAL(65,30),
    "observaciones" TEXT,
    "estado" "EstadoOrden" NOT NULL DEFAULT 'borrador',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_personal" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "turno" "Turno" NOT NULL,
    "areaId" TEXT NOT NULL,
    "rolOperativo" TEXT NOT NULL,
    "horarioInicio" TEXT,
    "horarioFin" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignaciones_personal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "actorUsername" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "ipAddress" TEXT,
    "requestId" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_code_key" ON "areas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_supersededById_key" ON "products"("supersededById");

-- CreateIndex
CREATE INDEX "products_productGroupId_idx" ON "products"("productGroupId");

-- CreateIndex
CREATE INDEX "products_areaId_active_idx" ON "products"("areaId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "products_areaId_codigo_version_key" ON "products"("areaId", "codigo", "version");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "staff_supersededById_key" ON "staff"("supersededById");

-- CreateIndex
CREATE INDEX "staff_staffGroupId_idx" ON "staff"("staffGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "tanques_code_key" ON "tanques"("code");

-- CreateIndex
CREATE UNIQUE INDEX "capacidad_producto_tanque_supersededById_key" ON "capacidad_producto_tanque"("supersededById");

-- CreateIndex
CREATE INDEX "capacidad_producto_tanque_groupId_idx" ON "capacidad_producto_tanque"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "capacidad_producto_tanque_productId_tanqueId_version_key" ON "capacidad_producto_tanque"("productId", "tanqueId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "semanas_areaId_fechaInicio_key" ON "semanas"("areaId", "fechaInicio");

-- CreateIndex
CREATE INDEX "ordenes_semanaId_idx" ON "ordenes"("semanaId");

-- CreateIndex
CREATE INDEX "ordenes_areaId_fecha_turno_idx" ON "ordenes"("areaId", "fecha", "turno");

-- CreateIndex
CREATE INDEX "asignaciones_personal_staffId_fecha_turno_idx" ON "asignaciones_personal"("staffId", "fecha", "turno");

-- CreateIndex
CREATE INDEX "asignaciones_personal_ordenId_idx" ON "asignaciones_personal"("ordenId");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_actorUserId_idx" ON "audit_log"("actorUserId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tanques" ADD CONSTRAINT "tanques_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semanas" ADD CONSTRAINT "semanas_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_semanaId_fkey" FOREIGN KEY ("semanaId") REFERENCES "semanas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_personal" ADD CONSTRAINT "asignaciones_personal_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterEnum
ALTER TYPE "EstadoOrden" ADD VALUE 'cancelada';

-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "correlativoFabricacion" INTEGER,
ADD COLUMN     "correlativoProduccion" INTEGER,
ADD COLUMN     "fechaFinReal" TIMESTAMP(3),
ADD COLUMN     "fechaInicioReal" TIMESTAMP(3),
ADD COLUMN     "fechaVencimiento" TEXT,
ADD COLUMN     "motivoCancelacion" TEXT,
ADD COLUMN     "numeroLote" TEXT,
ADD COLUMN     "volumenTotalL" DECIMAL(65,30),
ADD COLUMN     "volumenUnitarioL" DECIMAL(65,30);

-- CreateIndex
CREATE INDEX "ordenes_numeroLote_idx" ON "ordenes"("numeroLote");

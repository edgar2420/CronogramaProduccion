import type { PrismaClient } from "@prisma/client";
import type { Orden } from "../../../domain/orden/Orden.entity.js";
import type {
  CancelOrdenData,
  CreateOrdenData,
  OrdenRepository,
  RegisterRealData,
  UpdateOrdenData,
} from "../../../domain/orden/Orden.repository.js";

type PrismaOrdenRow = Awaited<ReturnType<PrismaClient["orden"]["create"]>>;

function toDomain(row: PrismaOrdenRow): Orden {
  return {
    ...row,
    planificado: row.planificado.toString(),
    real: row.real?.toString() ?? null,
    volumenUnitarioL: row.volumenUnitarioL?.toString() ?? null,
    volumenTotalL: row.volumenTotalL?.toString() ?? null,
  };
}

export class PrismaOrdenRepository implements OrdenRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<Orden | null> {
    const row = await this.client.orden.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByNumeroLote(numeroLote: string): Promise<Orden | null> {
    const row = await this.client.orden.findFirst({ where: { numeroLote, active: true } });
    return row ? toDomain(row) : null;
  }

  async listBySemana(semanaId: string): Promise<Orden[]> {
    const rows = await this.client.orden.findMany({
      where: { semanaId, active: true },
      orderBy: [{ fecha: "asc" }, { turno: "asc" }],
    });
    return rows.map(toDomain);
  }

  async countBorradorBySemana(semanaId: string): Promise<number> {
    return this.client.orden.count({ where: { semanaId, estado: "borrador", active: true } });
  }

  async create(data: CreateOrdenData): Promise<Orden> {
    const row = await this.client.orden.create({
      data: {
        semanaId: data.semanaId,
        areaId: data.areaId,
        fecha: data.fecha,
        turno: data.turno,
        productId: data.productId,
        tanqueId: data.tanqueId ?? null,
        opCode: data.opCode ?? null,
        numeroLote: data.numeroLote ?? null,
        correlativoFabricacion: data.correlativoFabricacion ?? null,
        correlativoProduccion: data.correlativoProduccion ?? null,
        fechaVencimiento: data.fechaVencimiento ?? null,
        volumenUnitarioL: data.volumenUnitarioL ?? null,
        volumenTotalL: data.volumenTotalL ?? null,
        planificado: data.planificado,
        createdByUserId: data.createdByUserId,
      },
    });
    return toDomain(row);
  }

  async update(id: string, data: UpdateOrdenData): Promise<Orden> {
    const row = await this.client.orden.update({
      where: { id },
      data: {
        ...(data.fecha !== undefined ? { fecha: data.fecha } : {}),
        ...(data.turno !== undefined ? { turno: data.turno } : {}),
        ...(data.productId !== undefined ? { productId: data.productId } : {}),
        ...(data.tanqueId !== undefined ? { tanqueId: data.tanqueId } : {}),
        ...(data.opCode !== undefined ? { opCode: data.opCode } : {}),
        ...(data.numeroLote !== undefined ? { numeroLote: data.numeroLote } : {}),
        ...(data.correlativoFabricacion !== undefined ? { correlativoFabricacion: data.correlativoFabricacion } : {}),
        ...(data.correlativoProduccion !== undefined ? { correlativoProduccion: data.correlativoProduccion } : {}),
        ...(data.fechaVencimiento !== undefined ? { fechaVencimiento: data.fechaVencimiento } : {}),
        ...(data.volumenUnitarioL !== undefined ? { volumenUnitarioL: data.volumenUnitarioL } : {}),
        ...(data.volumenTotalL !== undefined ? { volumenTotalL: data.volumenTotalL } : {}),
        ...(data.planificado !== undefined ? { planificado: data.planificado } : {}),
        ...(data.estado !== undefined ? { estado: data.estado } : {}),
      },
    });
    return toDomain(row);
  }

  async registerReal(id: string, data: RegisterRealData): Promise<Orden> {
    const row = await this.client.orden.update({
      where: { id },
      data: {
        real: data.real,
        observaciones: data.observaciones ?? null,
        estado: data.estado,
        ...(data.fechaInicioReal !== undefined ? { fechaInicioReal: data.fechaInicioReal } : {}),
        ...(data.fechaFinReal !== undefined ? { fechaFinReal: data.fechaFinReal } : {}),
      },
    });
    return toDomain(row);
  }

  async cancel(id: string, data: CancelOrdenData): Promise<Orden> {
    const row = await this.client.orden.update({
      where: { id },
      data: { estado: "cancelada", motivoCancelacion: data.motivoCancelacion },
    });
    return toDomain(row);
  }

  async deactivate(id: string): Promise<Orden> {
    const row = await this.client.orden.update({ where: { id }, data: { active: false } });
    return toDomain(row);
  }

  async bulkTransitionBorradorToEnProceso(semanaId: string): Promise<number> {
    const result = await this.client.orden.updateMany({
      where: { semanaId, estado: "borrador", active: true },
      data: { estado: "en_proceso" },
    });
    return result.count;
  }
}

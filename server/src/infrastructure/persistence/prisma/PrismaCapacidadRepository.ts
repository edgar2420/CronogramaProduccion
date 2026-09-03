import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { CapacidadProductoTanque } from "../../../domain/capacidad/Capacidad.entity.js";
import type {
  CapacidadRepository,
  CreateCapacidadData,
  ReviseCapacidadData,
} from "../../../domain/capacidad/Capacidad.repository.js";
import { NotFoundError } from "../../../domain/shared/DomainError.js";

// Prisma Decimal se mapea a string en el dominio para no filtrar el tipo de
// Prisma fuera de la capa de infraestructura.
type PrismaCapacidadRow = Awaited<ReturnType<PrismaClient["capacidadProductoTanque"]["create"]>>;

function toDomain(row: PrismaCapacidadRow): CapacidadProductoTanque {
  return {
    ...row,
    volumenUnitarioMl: row.volumenUnitarioMl.toString(),
    volumenAValidarL: row.volumenAValidarL.toString(),
    lotesProgramadosDia: row.lotesProgramadosDia.toString(),
    cantidadTeoricaDia: row.cantidadTeoricaDia.toString(),
    horasEnvasado: row.horasEnvasado?.toString() ?? null,
    horasAnalisis: row.horasAnalisis?.toString() ?? null,
  };
}

export class PrismaCapacidadRepository implements CapacidadRepository {
  constructor(private readonly client: PrismaClient) {}

  async findCurrentById(id: string): Promise<CapacidadProductoTanque | null> {
    const row = await this.client.capacidadProductoTanque.findFirst({ where: { id, validTo: null } });
    return row ? toDomain(row) : null;
  }

  async findCurrentByProductoYTanque(
    productId: string,
    tanqueId: string
  ): Promise<CapacidadProductoTanque | null> {
    const row = await this.client.capacidadProductoTanque.findFirst({
      where: { productId, tanqueId, validTo: null },
    });
    return row ? toDomain(row) : null;
  }

  async listByProducto(productId: string): Promise<CapacidadProductoTanque[]> {
    const rows = await this.client.capacidadProductoTanque.findMany({
      where: { productId, validTo: null },
    });
    return rows.map(toDomain);
  }

  async create(data: CreateCapacidadData): Promise<CapacidadProductoTanque> {
    const row = await this.client.capacidadProductoTanque.create({
      data: {
        groupId: randomUUID(),
        version: 1,
        productId: data.productId,
        tanqueId: data.tanqueId,
        volumenUnitarioMl: data.volumenUnitarioMl,
        volumenAValidarL: data.volumenAValidarL,
        lotesProgramadosDia: data.lotesProgramadosDia,
        cantidadTeoricaDia: data.cantidadTeoricaDia,
        horasEnvasado: data.horasEnvasado ?? null,
        horasAnalisis: data.horasAnalisis ?? null,
        observaciones: data.observaciones ?? null,
        createdByUserId: data.createdByUserId,
      },
    });
    return toDomain(row);
  }

  async createRevision(currentId: string, data: ReviseCapacidadData): Promise<CapacidadProductoTanque> {
    return this.client.$transaction(async (tx) => {
      const current = await tx.capacidadProductoTanque.findFirst({
        where: { id: currentId, validTo: null },
      });
      if (!current) throw new NotFoundError("CapacidadProductoTanque", currentId);

      const next = await tx.capacidadProductoTanque.create({
        data: {
          groupId: current.groupId,
          version: current.version + 1,
          productId: current.productId,
          tanqueId: current.tanqueId,
          volumenUnitarioMl: data.volumenUnitarioMl ?? current.volumenUnitarioMl,
          volumenAValidarL: data.volumenAValidarL ?? current.volumenAValidarL,
          lotesProgramadosDia: data.lotesProgramadosDia ?? current.lotesProgramadosDia,
          cantidadTeoricaDia: data.cantidadTeoricaDia ?? current.cantidadTeoricaDia,
          horasEnvasado: data.horasEnvasado !== undefined ? data.horasEnvasado : current.horasEnvasado,
          horasAnalisis: data.horasAnalisis !== undefined ? data.horasAnalisis : current.horasAnalisis,
          observaciones: data.observaciones !== undefined ? data.observaciones : current.observaciones,
          active: data.active !== undefined ? data.active : current.active,
          changeReason: data.changeReason,
          createdByUserId: data.createdByUserId,
        },
      });

      await tx.capacidadProductoTanque.update({
        where: { id: current.id },
        data: { validTo: new Date(), supersededById: next.id },
      });

      return toDomain(next);
    });
  }
}

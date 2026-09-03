import type { CapacidadRepository } from "../../domain/capacidad/Capacidad.repository.js";
import type { ProductRepository } from "../../domain/product/Product.repository.js";
import type { TanqueRepository } from "../../domain/tanque/Tanque.repository.js";
import type { AuditLogRepository } from "../../domain/audit/AuditLog.repository.js";
import { NotFoundError } from "../../domain/shared/DomainError.js";
import type { ActorContext } from "../shared/ActorContext.js";

export interface SetCapacidadInput {
  productId: string;
  tanqueId: string;
  volumenUnitarioMl: number;
  volumenAValidarL: number;
  lotesProgramadosDia: number;
  cantidadTeoricaDia: number;
  horasEnvasado?: number | null;
  horasAnalisis?: number | null;
  observaciones?: string | null;
  /** Obligatorio solo si ya existe una capacidad vigente para este producto+tanque (es una revisión). */
  changeReason?: string;
}

/**
 * Crea o revisa la capacidad teórica de un producto en un tanque
 * ("LEVANTAMIENTO DE LOTES PARA FM SEGÚN ÁREA"). Si ya existe una versión
 * vigente para ese producto+tanque, esto es una edición versionada (exige
 * changeReason); si no existe, es un alta nueva.
 */
export class SetCapacidadUseCase {
  constructor(
    private readonly capacidadRepository: CapacidadRepository,
    private readonly productRepository: ProductRepository,
    private readonly tanqueRepository: TanqueRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  async execute(input: SetCapacidadInput, actor: ActorContext) {
    const product = await this.productRepository.findCurrentById(input.productId);
    if (!product) throw new NotFoundError("Product", input.productId);

    const tanque = await this.tanqueRepository.findById(input.tanqueId);
    if (!tanque) throw new NotFoundError("Tanque", input.tanqueId);

    const existing = await this.capacidadRepository.findCurrentByProductoYTanque(
      input.productId,
      input.tanqueId
    );

    if (!existing) {
      const created = await this.capacidadRepository.create({
        productId: input.productId,
        tanqueId: input.tanqueId,
        volumenUnitarioMl: input.volumenUnitarioMl,
        volumenAValidarL: input.volumenAValidarL,
        lotesProgramadosDia: input.lotesProgramadosDia,
        cantidadTeoricaDia: input.cantidadTeoricaDia,
        horasEnvasado: input.horasEnvasado ?? null,
        horasAnalisis: input.horasAnalisis ?? null,
        observaciones: input.observaciones ?? null,
        createdByUserId: actor.userId,
      });

      await this.auditLogRepository.append({
        actorUserId: actor.userId,
        actorUsername: actor.username,
        action: "CAPACIDAD_CREATE",
        entityType: "CapacidadProductoTanque",
        entityId: created.id,
        afterJson: created,
        ipAddress: actor.ipAddress ?? null,
        requestId: actor.requestId ?? null,
      });

      return created;
    }

    if (!input.changeReason?.trim()) {
      throw new Error("changeReason es obligatorio al revisar una capacidad ya existente");
    }

    const revised = await this.capacidadRepository.createRevision(existing.id, {
      volumenUnitarioMl: input.volumenUnitarioMl,
      volumenAValidarL: input.volumenAValidarL,
      lotesProgramadosDia: input.lotesProgramadosDia,
      cantidadTeoricaDia: input.cantidadTeoricaDia,
      horasEnvasado: input.horasEnvasado ?? null,
      horasAnalisis: input.horasAnalisis ?? null,
      observaciones: input.observaciones ?? null,
      changeReason: input.changeReason,
      createdByUserId: actor.userId,
    });

    await this.auditLogRepository.append({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      action: "CAPACIDAD_UPDATE",
      entityType: "CapacidadProductoTanque",
      entityId: revised.id,
      beforeJson: existing,
      afterJson: revised,
      ipAddress: actor.ipAddress ?? null,
      requestId: actor.requestId ?? null,
    });

    return revised;
  }
}

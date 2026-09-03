import { prisma } from "../infrastructure/persistence/prisma/prismaClient.js";
import { PrismaAreaRepository } from "../infrastructure/persistence/prisma/PrismaAreaRepository.js";
import { PrismaProductRepository } from "../infrastructure/persistence/prisma/PrismaProductRepository.js";
import { PrismaAuditLogRepository } from "../infrastructure/persistence/prisma/PrismaAuditLogRepository.js";
import { PrismaUserRepository } from "../infrastructure/persistence/prisma/PrismaUserRepository.js";
import { PrismaStaffRepository } from "../infrastructure/persistence/prisma/PrismaStaffRepository.js";
import { PrismaTanqueRepository } from "../infrastructure/persistence/prisma/PrismaTanqueRepository.js";
import { PrismaCapacidadRepository } from "../infrastructure/persistence/prisma/PrismaCapacidadRepository.js";
import { PrismaSemanaRepository } from "../infrastructure/persistence/prisma/PrismaSemanaRepository.js";
import { PrismaOrdenRepository } from "../infrastructure/persistence/prisma/PrismaOrdenRepository.js";
import { PrismaAsignacionRepository } from "../infrastructure/persistence/prisma/PrismaAsignacionRepository.js";
import { BcryptPasswordHasher } from "../infrastructure/security/BcryptPasswordHasher.js";
import { JwtTokenService } from "../infrastructure/security/JwtTokenService.js";
import { SystemClock } from "../infrastructure/security/SystemClock.js";

import { CreateAreaUseCase } from "../application/area/CreateArea.usecase.js";
import { UpdateAreaUseCase, SetAreaActiveUseCase } from "../application/area/UpdateArea.usecase.js";
import { ListAreasUseCase } from "../application/area/ListAreas.usecase.js";
import { CreateProductUseCase } from "../application/product/CreateProduct.usecase.js";
import { UpdateProductUseCase } from "../application/product/UpdateProduct.usecase.js";
import { DeactivateProductUseCase } from "../application/product/DeactivateProduct.usecase.js";
import { ListProductsUseCase } from "../application/product/ListProducts.usecase.js";
import { GetProductUseCase } from "../application/product/GetProduct.usecase.js";
import { GetProductHistoryUseCase } from "../application/product/GetProductHistory.usecase.js";
import { LoginUseCase } from "../application/auth/Login.usecase.js";
import { RefreshTokenUseCase } from "../application/auth/RefreshToken.usecase.js";
import { LogoutUseCase } from "../application/auth/Logout.usecase.js";
import { GetMeUseCase } from "../application/auth/GetMe.usecase.js";

import { CreateStaffUseCase } from "../application/staff/CreateStaff.usecase.js";
import { UpdateStaffUseCase } from "../application/staff/UpdateStaff.usecase.js";
import { DeactivateStaffUseCase } from "../application/staff/DeactivateStaff.usecase.js";
import { ListStaffUseCase } from "../application/staff/ListStaff.usecase.js";
import { UpdateStaffSkillsUseCase } from "../application/staff/UpdateStaffSkills.usecase.js";

import { CreateUserUseCase } from "../application/user/CreateUser.usecase.js";
import { UpdateUserUseCase } from "../application/user/UpdateUser.usecase.js";
import { ListUsersUseCase } from "../application/user/ListUsers.usecase.js";

import { CreateTanqueUseCase } from "../application/tanque/CreateTanque.usecase.js";
import { ListTanquesUseCase } from "../application/tanque/ListTanques.usecase.js";

import { SetCapacidadUseCase } from "../application/capacidad/SetCapacidad.usecase.js";
import { GetCapacidadByProductoUseCase } from "../application/capacidad/GetCapacidadByProducto.usecase.js";

import { EnsureSemanaUseCase } from "../application/semana/EnsureSemana.usecase.js";
import { PublishSemanaUseCase } from "../application/semana/PublishSemana.usecase.js";
import { CloseSemanaUseCase } from "../application/semana/CloseSemana.usecase.js";
import { ListSemanasUseCase } from "../application/semana/ListSemanas.usecase.js";

import { CreateOrdenUseCase } from "../application/orden/CreateOrden.usecase.js";
import { UpdateOrdenUseCase } from "../application/orden/UpdateOrden.usecase.js";
import { RegisterRealUseCase } from "../application/orden/RegisterReal.usecase.js";
import { DeleteOrdenUseCase } from "../application/orden/DeleteOrden.usecase.js";
import { CancelOrdenUseCase } from "../application/orden/CancelOrden.usecase.js";
import { ListOrdenesBySemanaUseCase } from "../application/orden/ListOrdenesBySemana.usecase.js";

import { AssignStaffUseCase } from "../application/asignacion/AssignStaff.usecase.js";
import { RevokeAssignmentUseCase } from "../application/asignacion/RevokeAssignment.usecase.js";
import { ListAsignacionesByOrdenUseCase } from "../application/asignacion/ListAsignacionesByOrden.usecase.js";

import { env } from "./env.js";

const areaRepository = new PrismaAreaRepository(prisma);
const productRepository = new PrismaProductRepository(prisma);
const auditLogRepository = new PrismaAuditLogRepository(prisma);
const userRepository = new PrismaUserRepository(prisma);
const staffRepository = new PrismaStaffRepository(prisma);
const tanqueRepository = new PrismaTanqueRepository(prisma);
const capacidadRepository = new PrismaCapacidadRepository(prisma);
const semanaRepository = new PrismaSemanaRepository(prisma);
const ordenRepository = new PrismaOrdenRepository(prisma);
const asignacionRepository = new PrismaAsignacionRepository(prisma);

const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService({
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessTtl: env.JWT_ACCESS_TTL,
  refreshTtl: env.JWT_REFRESH_TTL,
});
const clock = new SystemClock();

/** Contenedor de dependencias simple (wiring manual, sin framework de DI). */
export const container = {
  auditLogRepository,
  areas: {
    create: new CreateAreaUseCase(areaRepository, auditLogRepository),
    update: new UpdateAreaUseCase(areaRepository, auditLogRepository),
    setActive: new SetAreaActiveUseCase(areaRepository, auditLogRepository),
    list: new ListAreasUseCase(areaRepository),
  },
  products: {
    create: new CreateProductUseCase(productRepository, areaRepository, auditLogRepository),
    update: new UpdateProductUseCase(productRepository, areaRepository, auditLogRepository),
    deactivate: new DeactivateProductUseCase(productRepository, auditLogRepository),
    list: new ListProductsUseCase(productRepository),
    get: new GetProductUseCase(productRepository),
    getHistory: new GetProductHistoryUseCase(productRepository),
  },
  auth: {
    login: new LoginUseCase(userRepository, passwordHasher, tokenService, auditLogRepository, clock, {
      maxFailedAttempts: env.LOGIN_MAX_FAILED_ATTEMPTS,
      lockoutMinutes: env.LOGIN_LOCKOUT_MINUTES,
    }),
    refresh: new RefreshTokenUseCase(userRepository, tokenService),
    logout: new LogoutUseCase(auditLogRepository),
    me: new GetMeUseCase(userRepository),
  },
  users: {
    create: new CreateUserUseCase(userRepository, passwordHasher, auditLogRepository),
    update: new UpdateUserUseCase(userRepository, passwordHasher, auditLogRepository),
    list: new ListUsersUseCase(userRepository),
  },
  staff: {
    create: new CreateStaffUseCase(staffRepository, auditLogRepository),
    update: new UpdateStaffUseCase(staffRepository, auditLogRepository),
    deactivate: new DeactivateStaffUseCase(staffRepository, auditLogRepository),
    list: new ListStaffUseCase(staffRepository),
    updateSkills: new UpdateStaffSkillsUseCase(staffRepository, auditLogRepository),
  },
  tanques: {
    create: new CreateTanqueUseCase(tanqueRepository, areaRepository, auditLogRepository),
    list: new ListTanquesUseCase(tanqueRepository),
  },
  capacidad: {
    set: new SetCapacidadUseCase(capacidadRepository, productRepository, tanqueRepository, auditLogRepository),
    getByProducto: new GetCapacidadByProductoUseCase(capacidadRepository),
  },
  semanas: {
    ensure: new EnsureSemanaUseCase(semanaRepository, areaRepository),
    publish: new PublishSemanaUseCase(semanaRepository, ordenRepository, auditLogRepository, clock),
    close: new CloseSemanaUseCase(semanaRepository, ordenRepository, auditLogRepository, clock),
    list: new ListSemanasUseCase(semanaRepository),
  },
  ordenes: {
    create: new CreateOrdenUseCase(ordenRepository, semanaRepository, productRepository, auditLogRepository),
    update: new UpdateOrdenUseCase(ordenRepository, auditLogRepository),
    registerReal: new RegisterRealUseCase(ordenRepository, auditLogRepository),
    cancel: new CancelOrdenUseCase(ordenRepository, auditLogRepository),
    remove: new DeleteOrdenUseCase(ordenRepository, auditLogRepository),
    listBySemana: new ListOrdenesBySemanaUseCase(ordenRepository),
  },
  asignaciones: {
    assign: new AssignStaffUseCase(asignacionRepository, ordenRepository, staffRepository, auditLogRepository),
    revoke: new RevokeAssignmentUseCase(asignacionRepository, auditLogRepository),
    listByOrden: new ListAsignacionesByOrdenUseCase(asignacionRepository),
  },
  tokenService,
};

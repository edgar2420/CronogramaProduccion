export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} con id ${id} no encontrado`, "NOT_FOUND");
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT");
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "No autorizado") {
    super(message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Acceso prohibido") {
    super(message, "FORBIDDEN");
  }
}

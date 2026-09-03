import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { DomainError } from "../../../domain/shared/DomainError.js";

const statusByCode: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: "Datos inválidos", details: err.flatten() });
    return;
  }

  if (err instanceof DomainError) {
    const status = statusByCode[err.code] ?? 400;
    res.status(status).json({ error: err.code, message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "INTERNAL_ERROR", message: "Error interno del servidor" });
};

import type { Request } from "express";
import { ValidationError } from "../../domain/shared/DomainError.js";

/** Extrae un param de ruta garantizando que exista (Express siempre lo puebla si la ruta matchea). */
export function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) throw new ValidationError(`Parámetro de ruta '${name}' faltante`);
  return value;
}

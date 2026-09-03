import type { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response) => Promise<unknown>;

/** Envuelve un handler async para que sus rechazos lleguen a errorHandler en vez de colgar la request. */
export function asyncHandler(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}

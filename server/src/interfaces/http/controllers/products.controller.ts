import type { Request, Response } from "express";
import { container } from "../../../config/container.js";
import {
  createProductDto,
  deactivateProductDto,
  listProductsQueryDto,
  updateProductDto,
} from "../dto/product.dto.js";
import type { ActorContext } from "../../../application/shared/ActorContext.js";
import { requireParam } from "../requireParam.js";

function actorFrom(req: Request): ActorContext {
  const user = req.user!;
  return {
    userId: user.userId,
    username: user.username,
    role: user.role,
    ipAddress: req.ip ?? null,
    requestId: req.requestId ?? null,
  };
}

export async function listProducts(req: Request, res: Response) {
  const query = listProductsQueryDto.parse(req.query);
  const result = await container.products.list.execute(query);
  res.json(result);
}

export async function getProduct(req: Request, res: Response) {
  const product = await container.products.get.execute(requireParam(req, "id"));
  res.json(product);
}

export async function getProductHistory(req: Request, res: Response) {
  const history = await container.products.getHistory.execute(requireParam(req, "id"));
  res.json({ items: history });
}

export async function createProduct(req: Request, res: Response) {
  const input = createProductDto.parse(req.body);
  const product = await container.products.create.execute(input, actorFrom(req));
  res.status(201).json(product);
}

export async function updateProduct(req: Request, res: Response) {
  const input = updateProductDto.parse(req.body);
  const product = await container.products.update.execute(requireParam(req, "id"), input, actorFrom(req));
  res.json(product);
}

export async function deactivateProduct(req: Request, res: Response) {
  const input = deactivateProductDto.parse(req.body);
  const product = await container.products.deactivate.execute(
    requireParam(req, "id"),
    input,
    actorFrom(req)
  );
  res.json(product);
}

import type { Product } from "./Product.entity.js";

export interface CreateProductData {
  codigo: string;
  nombre: string;
  vol?: string | null;
  envase?: string | null;
  areaId: string;
  createdByUserId: string;
}

export interface ReviseProductData {
  codigo?: string;
  nombre?: string;
  vol?: string | null;
  envase?: string | null;
  areaId?: string;
  active?: boolean;
  changeReason: string;
  createdByUserId: string;
}

export interface ListProductsFilter {
  areaId?: string;
  activeOnly?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListProductsResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Puerto de persistencia para Product. Solo expone creación de versiones
 * nuevas (create / createRevision), nunca una operación de "update in place"
 * ni "delete": eso es lo que garantiza la trazabilidad ALCOA+ a nivel de tipo.
 */
export interface ProductRepository {
  findCurrentById(id: string): Promise<Product | null>;
  /** Busca una fila por id sin importar si es la versión vigente o una histórica. */
  findByIdAnyVersion(id: string): Promise<Product | null>;
  findHistoryByGroupId(productGroupId: string): Promise<Product[]>;
  list(filter: ListProductsFilter): Promise<ListProductsResult>;
  findCurrentByAreaAndCodigo(areaId: string, codigo: string): Promise<Product | null>;
  create(data: CreateProductData): Promise<Product>;
  /** Cierra la versión vigente (validTo) y crea la siguiente versión. */
  createRevision(currentId: string, data: ReviseProductData): Promise<Product>;
}

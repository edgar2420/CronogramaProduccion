/**
 * Products API Service
 *
 * Habla siempre con el backend real (server/), que aplica versionado
 * inmutable: editar/desactivar un producto nunca sobreescribe la fila
 * vigente, crea una nueva versión (ver /products/:id/history).
 */
import { API_CONFIG, buildApiUrl, getAuthHeader, ApiError } from "./api.config";

export interface Product {
    id: string;
    productGroupId: string;
    version: number;
    codigo: string;
    nombre: string;
    vol: string | null;
    envase: string | null;
    areaId: string;
    active: boolean;
    validFrom: string;
    validTo: string | null;
    changeReason: string | null;
    createdByUserId: string;
    createdAt: string;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(buildApiUrl(path), {
        ...init,
        headers: { ...API_CONFIG.HEADERS, ...getAuthHeader(), ...(init?.headers ?? {}) },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new ApiError(body?.message ?? "Error de comunicación con el servidor", response.status, body);
    }
    return body as T;
}

export const getProducts = async (filter: ListProductsFilter = {}): Promise<ListProductsResult> => {
    const params = new URLSearchParams();
    if (filter.areaId) params.set("areaId", filter.areaId);
    if (filter.activeOnly) params.set("activeOnly", "true");
    if (filter.search) params.set("search", filter.search);
    if (filter.page) params.set("page", String(filter.page));
    if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
    const query = params.toString();
    return request<ListProductsResult>(`/products${query ? `?${query}` : ""}`);
};

/**
 * Todo el catálogo que cumple el filtro, recorriendo las páginas: el API
 * devuelve como máximo 200 por página.
 */
export const getAllProducts = async (filter: Omit<ListProductsFilter, "page" | "pageSize"> = {}): Promise<Product[]> => {
    const pageSize = 200;
    const items: Product[] = [];
    for (let page = 1; ; page++) {
        const result = await getProducts({ ...filter, page, pageSize });
        items.push(...result.items);
        if (result.items.length < pageSize || items.length >= result.total) return items;
    }
};

export const getProduct = async (id: string): Promise<Product> => {
    return request<Product>(`/products/${id}`);
};

export const getProductHistory = async (id: string): Promise<Product[]> => {
    const { items } = await request<{ items: Product[] }>(`/products/${id}/history`);
    return items;
};

export interface CreateProductInput {
    codigo: string;
    nombre: string;
    vol?: string | null;
    envase?: string | null;
    areaId: string;
}

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
    return request<Product>("/products", { method: "POST", body: JSON.stringify(input) });
};

export interface UpdateProductInput {
    codigo?: string;
    nombre?: string;
    vol?: string | null;
    envase?: string | null;
    areaId?: string;
    changeReason: string;
}

export const updateProduct = async (id: string, input: UpdateProductInput): Promise<Product> => {
    return request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(input) });
};

export const deactivateProduct = async (id: string, changeReason: string): Promise<Product> => {
    return request<Product>(`/products/${id}/deactivate`, {
        method: "PATCH",
        body: JSON.stringify({ changeReason }),
    });
};

/**
 * Areas API Service — habla siempre con el backend real.
 */
import { API_CONFIG, buildApiUrl, getAuthHeader, ApiError } from "./api.config";

export interface Area {
    id: string;
    code: string;
    name: string;
    colorHex: string | null;
    active: boolean;
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

export const getAreas = async (): Promise<Area[]> => {
    const { items } = await request<{ items: Area[] }>("/areas");
    return items;
};

export const createArea = async (input: { code: string; name: string; colorHex?: string | null }): Promise<Area> => {
    return request<Area>("/areas", { method: "POST", body: JSON.stringify(input) });
};

export const updateArea = async (
    id: string,
    input: { name?: string; colorHex?: string | null }
): Promise<Area> => {
    return request<Area>(`/areas/${id}`, { method: "PUT", body: JSON.stringify(input) });
};

export const setAreaActive = async (id: string, active: boolean): Promise<Area> => {
    return request<Area>(`/areas/${id}/active`, { method: "PATCH", body: JSON.stringify({ active }) });
};

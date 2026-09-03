/**
 * Tanques API Service — habla siempre con el backend real.
 */
import { API_CONFIG, buildApiUrl, getAuthHeader, ApiError } from "./api.config";

export interface Tanque {
    id: string;
    code: string;
    areaId: string;
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

export const getTanques = async (areaId?: string): Promise<Tanque[]> => {
    const query = areaId ? `?areaId=${encodeURIComponent(areaId)}` : "";
    const { items } = await request<{ items: Tanque[] }>(`/tanques${query}`);
    return items;
};

export const createTanque = async (input: { code: string; areaId: string }): Promise<Tanque> => {
    return request<Tanque>("/tanques", { method: "POST", body: JSON.stringify(input) });
};

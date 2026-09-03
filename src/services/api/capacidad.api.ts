/**
 * Capacidad producto-tanque ("LEVANTAMIENTO DE LOTES PARA FM SEGÚN ÁREA") —
 * solo existe contra el backend real.
 */
import { API_CONFIG, buildApiUrl, getAuthHeader, ApiError } from "./api.config";

export interface CapacidadProductoTanque {
    id: string;
    productId: string;
    tanqueId: string;
    volumenUnitarioMl: string;
    volumenAValidarL: string;
    lotesProgramadosDia: string;
    cantidadTeoricaDia: string;
    horasEnvasado: string | null;
    horasAnalisis: string | null;
    observaciones: string | null;
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

export const getCapacidadByProducto = async (productId: string): Promise<CapacidadProductoTanque[]> => {
    const { items } = await request<{ items: CapacidadProductoTanque[] }>(`/productos/${productId}/capacidad`);
    return items;
};

export interface SetCapacidadInput {
    tanqueId: string;
    volumenUnitarioMl: number;
    volumenAValidarL: number;
    lotesProgramadosDia: number;
    cantidadTeoricaDia: number;
    horasEnvasado?: number | null;
    horasAnalisis?: number | null;
    observaciones?: string | null;
    changeReason?: string;
}

export const setCapacidad = async (
    productId: string,
    input: SetCapacidadInput
): Promise<CapacidadProductoTanque> => {
    return request<CapacidadProductoTanque>(`/productos/${productId}/capacidad`, {
        method: "POST",
        body: JSON.stringify(input),
    });
};

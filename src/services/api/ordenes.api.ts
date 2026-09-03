/**
 * Órdenes + Asignaciones API Service — backend real. Reemplaza, cuando
 * VITE_USE_REST_API=true, el par (schedule.store.ts + `asignados: string[]`)
 * por el modelo versionado del servidor con `productId`/`tanqueId` reales y
 * asignaciones de personal por id (ver server/ Fase 3).
 */
import { API_CONFIG, buildApiUrl, getAuthHeader, ApiError } from "./api.config";

export type Turno = "manana" | "tarde" | "noche";
export type EstadoOrden = "borrador" | "en_proceso" | "terminada";

export interface Orden {
    id: string;
    semanaId: string;
    areaId: string;
    fecha: string;
    turno: Turno;
    productId: string;
    tanqueId: string | null;
    opCode: string | null;
    planificado: string;
    real: string | null;
    observaciones: string | null;
    estado: EstadoOrden;
}

export interface AsignacionPersonal {
    id: string;
    ordenId: string;
    staffId: string;
    rolOperativo: string;
    horarioInicio: string | null;
    horarioFin: string | null;
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

export const getOrdenes = async (semanaId: string): Promise<Orden[]> => {
    const { items } = await request<{ items: Orden[] }>(`/ordenes?semanaId=${encodeURIComponent(semanaId)}`);
    return items;
};

export interface CreateOrdenInput {
    semanaId: string;
    fecha: string;
    turno: Turno;
    productId: string;
    tanqueId?: string | null;
    opCode?: string | null;
    planificado: number;
}

export const createOrden = async (input: CreateOrdenInput): Promise<Orden> => {
    return request<Orden>("/ordenes", { method: "POST", body: JSON.stringify(input) });
};

export const updateOrden = async (id: string, input: Partial<CreateOrdenInput & { estado: EstadoOrden }>): Promise<Orden> => {
    return request<Orden>(`/ordenes/${id}`, { method: "PUT", body: JSON.stringify(input) });
};

export const deleteOrden = async (id: string): Promise<Orden> => {
    return request<Orden>(`/ordenes/${id}`, { method: "DELETE" });
};

export const registerReal = async (
    id: string,
    real: number,
    observaciones?: string | null
): Promise<Orden> => {
    return request<Orden>(`/ordenes/${id}/registrar-real`, {
        method: "POST",
        body: JSON.stringify({ real, observaciones: observaciones ?? null }),
    });
};

export const getAsignaciones = async (ordenId: string): Promise<AsignacionPersonal[]> => {
    const { items } = await request<{ items: AsignacionPersonal[] }>(`/ordenes/${ordenId}/asignaciones`);
    return items;
};

export const assignStaff = async (
    ordenId: string,
    input: { staffId: string; rolOperativo: string; horarioInicio?: string | null; horarioFin?: string | null }
): Promise<AsignacionPersonal> => {
    return request<AsignacionPersonal>(`/ordenes/${ordenId}/asignaciones`, {
        method: "POST",
        body: JSON.stringify(input),
    });
};

export const revokeAssignment = async (asignacionId: string): Promise<AsignacionPersonal> => {
    return request<AsignacionPersonal>(`/asignaciones/${asignacionId}`, { method: "DELETE" });
};

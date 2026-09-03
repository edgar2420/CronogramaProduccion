/**
 * Semanas API Service — backend real. En modo local, DashboardPage.tsx sigue
 * usando directamente src/services/storage/schedule.store.ts (no se toca en
 * esta fase); este archivo queda listo para cuando esa pantalla se migre.
 */
import { API_CONFIG, buildApiUrl, getAuthHeader, ApiError } from "./api.config";

export type EstadoSemana = "borrador" | "publicado" | "cerrado";

export interface Semana {
    id: string;
    areaId: string;
    fechaInicio: string;
    fechaFin: string;
    estado: EstadoSemana;
    publishedAt: string | null;
    closedAt: string | null;
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

export const getSemanas = async (areaId?: string): Promise<Semana[]> => {
    const query = areaId ? `?areaId=${encodeURIComponent(areaId)}` : "";
    const { items } = await request<{ items: Semana[] }>(`/semanas${query}`);
    return items;
};

export const ensureSemana = async (input: {
    areaId: string;
    fechaInicio: string;
    fechaFin: string;
}): Promise<Semana> => {
    return request<Semana>("/semanas", { method: "POST", body: JSON.stringify(input) });
};

export const publishSemana = async (id: string): Promise<Semana> => {
    return request<Semana>(`/semanas/${id}/publicar`, { method: "POST" });
};

export const closeSemana = async (id: string): Promise<Semana> => {
    return request<Semana>(`/semanas/${id}/cerrar`, { method: "POST" });
};

/**
 * Staff API Service — habla siempre con el backend real (versionado
 * inmutable, igual que products.api.ts).
 */
import { API_CONFIG, buildApiUrl, getAuthHeader, ApiError } from "./api.config";
import type { Staff, StaffRol, SkillKey, SkillLevel } from "@/features/staff/types";

interface RemoteStaff {
    id: string;
    nombre: string;
    codigoEmpleado: string | null;
    rolBase: "Operador" | "Supervisor" | "Tecnologo";
    areaIds: string[];
    active: boolean;
    skills: Partial<Record<SkillKey, SkillLevel>> | null;
}

// El backend usa "Tecnologo" (sin tilde, restricción del enum de Prisma); el
// resto de la app usa "Tecnólogo". Esta es la única frontera de conversión.
const toBackendRol = (r: StaffRol): "Operador" | "Supervisor" | "Tecnologo" =>
    r === "Tecnólogo" ? "Tecnologo" : r;
const toLocalRol = (r: "Operador" | "Supervisor" | "Tecnologo"): StaffRol =>
    r === "Tecnologo" ? "Tecnólogo" : r;

function toLocalShape(s: RemoteStaff): Staff {
    return {
        id: s.id,
        nombre: s.nombre,
        rolBase: toLocalRol(s.rolBase),
        areas: s.areaIds,
        activo: s.active,
        skills: s.skills ?? undefined,
    };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * El formulario de Personal (StaffForm) todavía ofrece las etiquetas de área
 * "de capacitación" heredadas (ej. "PGV", "BFS-PGV"), que NO son los ids
 * reales de Area en el backend (UUID). Filtramos aquí cualquier valor que no
 * sea un UUID real para no romper la validación del servidor.
 */
function onlyRealAreaIds(areaIds: string[]): string[] {
    return areaIds.filter((id) => UUID_RE.test(id));
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

export const getStaff = async (): Promise<Staff[]> => {
    const { items } = await request<{ items: RemoteStaff[] }>("/staff");
    return items.map(toLocalShape);
};

export interface CreateStaffInput {
    nombre: string;
    codigoEmpleado?: string | null;
    rolBase: StaffRol;
    areaIds: string[];
}

export const createStaff = async (input: CreateStaffInput): Promise<Staff> => {
    const created = await request<RemoteStaff>("/staff", {
        method: "POST",
        body: JSON.stringify({ ...input, rolBase: toBackendRol(input.rolBase), areaIds: onlyRealAreaIds(input.areaIds) }),
    });
    return toLocalShape(created);
};

export interface UpdateStaffInput {
    nombre?: string;
    codigoEmpleado?: string | null;
    rolBase?: StaffRol;
    areaIds?: string[];
    changeReason: string;
}

export const updateStaff = async (id: string, input: UpdateStaffInput): Promise<Staff> => {
    const updated = await request<RemoteStaff>(`/staff/${id}`, {
        method: "PUT",
        body: JSON.stringify({
            ...input,
            rolBase: input.rolBase ? toBackendRol(input.rolBase) : undefined,
            areaIds: input.areaIds ? onlyRealAreaIds(input.areaIds) : undefined,
        }),
    });
    return toLocalShape(updated);
};

export const deactivateStaff = async (id: string, changeReason: string): Promise<void> => {
    await request(`/staff/${id}/deactivate`, { method: "PATCH", body: JSON.stringify({ changeReason }) });
};

/**
 * Actualiza el mapa de capacitación por habilidad. A diferencia de nombre/rol/
 * áreas, esto NO crea una nueva versión de Staff (ver comentario en
 * schema.prisma) — es metadata operativa que se corrige seguido.
 */
export const updateStaffSkills = async (
    id: string,
    skills: Partial<Record<SkillKey, SkillLevel>>
): Promise<Staff> => {
    const updated = await request<RemoteStaff>(`/staff/${id}/skills`, {
        method: "PATCH",
        body: JSON.stringify({ skills }),
    });
    return toLocalShape(updated);
};

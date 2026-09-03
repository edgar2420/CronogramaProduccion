/**
 * Users API Service — habla siempre con el backend real. Gestión de usuarios
 * es exclusiva de superadmin (ver users.routes.ts en server/).
 */
import { API_CONFIG, buildApiUrl, getAuthHeader, ApiError } from "./api.config";
import type { Role, User } from "@/auth/types";

export interface RemoteUser {
    id: string;
    username: string;
    name: string;
    role: Role;
    active: boolean;
}

function toLocalShape(u: RemoteUser): User {
    // El backend nunca expone la contraseña; el campo queda vacío y no se usa
    // una vez autenticado (ver comentario "DEMO" en auth/types.ts).
    return { ...u, password: "" };
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

export const getUsers = async (): Promise<User[]> => {
    const { items } = await request<{ items: RemoteUser[] }>("/users");
    return items.map(toLocalShape);
};

export interface CreateUserInput {
    username: string;
    name: string;
    role: Role;
    password: string;
}

export const createUser = async (input: CreateUserInput): Promise<User> => {
    const created = await request<RemoteUser>("/users", { method: "POST", body: JSON.stringify(input) });
    return toLocalShape(created);
};

export interface UpdateUserInput {
    name?: string;
    role?: Role;
    active?: boolean;
    /** Si se manda, resetea la contraseña. */
    password?: string;
}

export const updateUser = async (id: string, input: UpdateUserInput): Promise<User> => {
    const updated = await request<RemoteUser>(`/users/${id}`, { method: "PUT", body: JSON.stringify(input) });
    return toLocalShape(updated);
};

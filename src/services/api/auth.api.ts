/**
 * Auth API Service
 *
 * Cuando API_CONFIG.USE_REST_API es true, habla con el backend real
 * (server/) en vez de comparar contraseñas en el navegador. El refresh
 * token vive en una cookie httpOnly seteada por el propio backend
 * (credentials: "include"), nunca se lee/escribe desde JS.
 */
import type { Role } from "@/auth/types";
import { API_CONFIG, buildApiUrl, getAuthHeader, ApiError } from "./api.config";

export interface RemoteUser {
    id: string;
    username: string;
    name: string;
    role: Role;
    active: boolean;
}

export interface LoginResult {
    accessToken: string;
    user: RemoteUser;
}

async function parseJsonOrThrow(response: Response) {
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new ApiError(body?.message ?? "Error de autenticación", response.status, body);
    }
    return body;
}

export const login = async (username: string, password: string): Promise<LoginResult> => {
    const response = await fetch(buildApiUrl("/auth/login"), {
        method: "POST",
        headers: API_CONFIG.HEADERS,
        credentials: "include",
        body: JSON.stringify({ username, password }),
    });
    return parseJsonOrThrow(response);
};

export const me = async (): Promise<{ user: RemoteUser }> => {
    const response = await fetch(buildApiUrl("/auth/me"), {
        headers: { ...API_CONFIG.HEADERS, ...getAuthHeader() },
        credentials: "include",
    });
    return parseJsonOrThrow(response);
};

export const refresh = async (): Promise<{ accessToken: string }> => {
    const response = await fetch(buildApiUrl("/auth/refresh"), {
        method: "POST",
        headers: API_CONFIG.HEADERS,
        credentials: "include",
    });
    return parseJsonOrThrow(response);
};

export const logout = async (): Promise<void> => {
    await fetch(buildApiUrl("/auth/logout"), {
        method: "POST",
        headers: { ...API_CONFIG.HEADERS, ...getAuthHeader() },
        credentials: "include",
    });
};

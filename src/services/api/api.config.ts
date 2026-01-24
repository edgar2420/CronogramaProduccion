/**
 * API Configuration
 * 
 * This file contains the configuration for API calls.
 * Currently uses localStorage, but can be easily switched to REST API.
 */

export const API_CONFIG = {
    // Toggle between localStorage (false) and REST API (true)
    USE_REST_API: false,

    // Base URL for API calls when USE_REST_API is true
    BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",

    // API version
    API_VERSION: "v1",

    // Timeout for requests (ms)
    TIMEOUT: 30000,

    // Common headers
    HEADERS: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
};

/**
 * Get authorization header
 * In the future, retrieve JWT token from session storage
 */
export const getAuthHeader = (): Record<string, string> => {
    const token = sessionStorage.getItem("auth_token");
    if (token) {
        return { Authorization: `Bearer ${token}` };
    }
    return {};
};

/**
 * Build full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
    return `${API_CONFIG.BASE_URL}/${API_CONFIG.API_VERSION}${endpoint}`;
};

/**
 * Generic API error handler
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public data?: unknown
    ) {
        super(message);
        this.name = "ApiError";
    }
}

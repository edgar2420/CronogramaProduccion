/**
 * API Types
 * 
 * Common types for API requests and responses.
 * These interfaces define the contract between frontend and backend.
 */

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    timestamp: string;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
    timestamp: string;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    timestamp: string;
}

/**
 * Common Query Parameters
 */
export interface QueryParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    filters?: Record<string, unknown>;
}

/**
 * HTTP Status Codes
 */
export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    INTERNAL_SERVER_ERROR = 500,
}

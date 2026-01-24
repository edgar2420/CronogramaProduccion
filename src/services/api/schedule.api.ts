/**
 * Schedule API Service
 * 
 * This service abstracts schedule/production data access.
 * Currently uses localStorage via existing store functions.
 * 
 * FUTURE BACKEND INTEGRATION:
 * When backend is ready, implement these methods using fetch/axios
 * and update API_CONFIG.USE_REST_API to true.
 * 
 * Expected REST Endpoints:
 * - GET    /weeks              - List all weeks (with filters)
 * - GET    /weeks/:id          - Get specific week
 * - POST   /weeks              - Create new week
 * - PUT    /weeks/:id          - Update week
 * - DELETE /weeks/:id          - Delete week
 * - POST   /weeks/:id/orders   - Add order to week
 * - PUT    /orders/:id         - Update order
 * - DELETE /orders/:id         - Delete order
 */

import type { Semana, Orden } from "@/features/schedule/types";
import type { ApiResponse } from "./api.types";
import { API_CONFIG } from "./api.config";

// Import existing localStorage functions
import {
    loadWeeks as loadWeeksFromStorage,
    upsertWeek as upsertWeekToStorage,
    removeOrder as removeOrderFromStorage,
} from "../storage/schedule.store";

/**
 * Get all weeks, optionally filtered by area
 */
export const getWeeks = async (areaId?: string): Promise<Semana[]> => {
    if (API_CONFIG.USE_REST_API) {
        // TODO: Implement REST API call
        // const response = await fetch(buildApiUrl('/weeks?areaId=' + areaId))
        // return response.json()
        throw new Error("REST API not implemented yet");
    }

    // Use localStorage
    const weeks = loadWeeksFromStorage();
    return areaId ? weeks.filter((w) => w.areaId === areaId) : weeks;
};

/**
 * Get a single week by ID and areaId
 */
export const getWeek = async (
    weekId: string,
    areaId: string
): Promise<Semana | null> => {
    if (API_CONFIG.USE_REST_API) {
        // TODO: Implement REST API call
        // const response = await fetch(buildApiUrl(`/weeks/${weekId}?areaId=${areaId}`))
        throw new Error("REST API not implemented yet");
    }

    const weeks = loadWeeksFromStorage();
    return weeks.find((w) => w.id === weekId && w.areaId === areaId) || null;
};

/**
 * Create or update a week
 */
export const saveWeek = async (week: Semana): Promise<Semana> => {
    if (API_CONFIG.USE_REST_API) {
        // TODO: Implement REST API call
        // const method = week.id ? 'PUT' : 'POST'
        // const url = week.id ? `/weeks/${week.id}` : '/weeks'
        // const response = await fetch(buildApiUrl(url), { method, body: JSON.stringify(week) })
        throw new Error("REST API not implemented yet");
    }

    upsertWeekToStorage(week);
    return week;
};

/**
 * Delete an order from a week
 */
export const deleteOrder = async (
    weekId: string,
    areaId: string,
    orderId: string
): Promise<void> => {
    if (API_CONFIG.USE_REST_API) {
        // TODO: Implement REST API call
        // await fetch(buildApiUrl(`/orders/${orderId}`), { method: 'DELETE' })
        throw new Error("REST API not implemented yet");
    }

    removeOrderFromStorage(weekId, areaId, orderId);
};

/**
 * Add an order to a week
 */
export const addOrderToWeek = async (
    weekId: string,
    areaId: string,
    order: Orden
): Promise<Orden> => {
    if (API_CONFIG.USE_REST_API) {
        // TODO: Implement REST API call
        // const response = await fetch(buildApiUrl(`/weeks/${weekId}/orders`), {
        //   method: 'POST',
        //   body: JSON.stringify(order)
        // })
        throw new Error("REST API not implemented yet");
    }

    const week = await getWeek(weekId, areaId);
    if (!week) {
        throw new Error("Week not found");
    }

    const updatedWeek = {
        ...week,
        ordenes: [...week.ordenes, order],
    };

    await saveWeek(updatedWeek);
    return order;
};

/**
 * Update an existing order
 */
export const updateOrder = async (
    weekId: string,
    areaId: string,
    orderId: string,
    updates: Partial<Orden>
): Promise<Orden> => {
    if (API_CONFIG.USE_REST_API) {
        // TODO: Implement REST API call
        // const response = await fetch(buildApiUrl(`/orders/${orderId}`), {
        //   method: 'PUT',
        //   body: JSON.stringify(updates)
        // })
        throw new Error("REST API not implemented yet");
    }

    const week = await getWeek(weekId, areaId);
    if (!week) {
        throw new Error("Week not found");
    }

    const updatedWeek = {
        ...week,
        ordenes: week.ordenes.map((o) =>
            o.id === orderId ? { ...o, ...updates } : o
        ),
    };

    await saveWeek(updatedWeek);

    const updatedOrder = updatedWeek.ordenes.find((o) => o.id === orderId);
    if (!updatedOrder) {
        throw new Error("Order not found after update");
    }

    return updatedOrder;
};

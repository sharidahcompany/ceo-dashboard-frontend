"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";
import { UserResource } from "./user.actions";

export interface CarStatusField {
    value: string;
    label: string;
}

export interface CarAssignmentResource {
    id: number;
    car_id: number;
    user_id: string;
    user?: UserResource | null;
    taken_at: string;
    returned_at?: string | null;
    notes?: string | null;
}

export interface CarResource {
    id: number;
    model: string;
    year: number;
    has_gps: boolean;
    traccar_device_id?: string | null;
    status: CarStatusField;
    current_assignment?: CarAssignmentResource | null;
    assignments?: CarAssignmentResource[];
    created_at: string;
    updated_at: string;
}

export interface CarData {
    model?: string;
    year?: number;
    status?: string;
    has_gps?: boolean;
    traccar_device_id?: string | null;
}

export async function getCars(query?: string): Promise<ActionResponse<{ data: CarResource[]; meta?: any }>> {
    try {
        const params = new URLSearchParams(query);
        params.set("include", "currentAssignment,currentAssignment.user");
        const response = await api.get(`/workspace/cars?${params.toString()}`);
        const responseData = response.data;
        return {
            success: true,
            data: {
                data: Array.isArray(responseData.data) ? responseData.data : [],
                meta: normalizePaginationMeta(responseData),
            },
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getCar(id: number | string): Promise<ActionResponse<CarResource>> {
    try {
        const response = await api.get(`/workspace/cars/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createCar(data: CarData): Promise<ActionResponse<CarResource>> {
    try {
        const response = await api.post("/workspace/cars", data);
        revalidatePath("/[locale]/cars", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateCar(id: number | string, data: CarData): Promise<ActionResponse<CarResource>> {
    try {
        const response = await api.put(`/workspace/cars/${id}`, data);
        revalidatePath("/[locale]/cars", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteCars(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/cars", { data: { ids } });
        revalidatePath("/[locale]/cars", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getCarAssignments(carId: number | string): Promise<ActionResponse<CarAssignmentResource[]>> {
    try {
        const response = await api.get(`/workspace/cars/${carId}/assignments`);
        return { success: true, data: response.data.data ?? [] };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export interface AssignCarData {
    user_id: string;
    taken_at?: string | null;
    notes?: string | null;
}

/** Checks a car out to an employee. Fails if it's already checked out to someone else. */
export async function assignCar(
    carId: number | string,
    data: AssignCarData,
): Promise<ActionResponse<CarAssignmentResource>> {
    try {
        const response = await api.post(`/workspace/cars/${carId}/assignments`, data);
        revalidatePath("/[locale]/cars", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/** Checks a car back in by closing its open assignment. */
export async function returnCar(
    carId: number | string,
    assignmentId: number | string,
    notes?: string,
): Promise<ActionResponse<CarAssignmentResource>> {
    try {
        const response = await api.post(`/workspace/cars/${carId}/assignments/${assignmentId}/return`, { notes });
        revalidatePath("/[locale]/cars", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export interface CarLocationPoint {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    recorded_at: string;
}

export interface CarLocationResource extends CarLocationPoint {
    id: number;
    car_id: number;
}

export async function getCarLocations(carId: number | string): Promise<ActionResponse<CarLocationResource[]>> {
    try {
        const response = await api.get(`/workspace/cars/${carId}/locations`);
        return { success: true, data: response.data.data ?? [] };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function saveCarLocations(
    carId: number | string,
    points: CarLocationPoint[],
): Promise<ActionResponse<void>> {
    try {
        const response = await api.post(`/workspace/cars/${carId}/locations`, { points });
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export interface ActiveCarLocations {
    id: number;
    model: string;
    traccar_device_id?: string | null;
    is_online: boolean;
    last_seen_at?: string | null;
    current_assignment?: CarAssignmentResource | null;
    locations: CarLocationResource[];
}

/**
 * Every GPS-equipped car currently checked out, with its recorded journey so
 * far, for the live cross-tenant missions/cars map. Accepts an explicit
 * tenantId (via the X-Tenant header) the same way getBranches() does.
 */
export async function getActiveCarLocations(
    tenantId?: string,
): Promise<ActionResponse<ActiveCarLocations[]>> {
    try {
        const response = await api.get(
            "/workspace/cars/live-locations",
            tenantId ? { headers: { "X-Tenant": tenantId } } : undefined,
        );
        return { success: true, data: response.data.data ?? [] };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

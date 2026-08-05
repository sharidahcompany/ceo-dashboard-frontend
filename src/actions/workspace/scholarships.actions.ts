"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";
import { UserResource } from "./user.actions";

// ==========================================
// TYPES
// ==========================================

export interface AvailableScholarshipResource {
    id: number;
    title: string;
    description: string;
    price: number;
    discount_percentage: number;
    discount_amount: number;
    final_price: number;
    duration: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AvailableScholarshipData {
    title: string;
    description: string;
    price: number;
    discount_percentage: number;
    duration: string;
    is_active?: boolean;
}

export interface ScholarshipRequestResource {
    id: number;
    user_id?: number;
    user?: UserResource;
    scholarship_id?: number | null;
    scholarship?: AvailableScholarshipResource | null;
    title: string;
    description: string;
    price: number;
    discount_percentage: number;
    discount_amount: number;
    final_price: number;
    duration: string | number;
    status: "pending" | "approved" | "rejected";
    created_at: string;
    updated_at: string;
}

export interface ScholarshipRequestData {
    user_id?: string | number;
    scholarship_id?: string | number | null;
    title?: string | null;
    description?: string | null;
    price: number;
    discount_percentage: number;
    duration?: string | number | null;
    status?: "pending" | "approved" | "rejected";
}

// ==========================================
// SCHOLARSHIPS ACTIONS (Backend Endpoint: /workspace/scholarships)
// ==========================================

export async function getAvailableScholarships(query?: string): Promise<ActionResponse<{ data: AvailableScholarshipResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/workspace/scholarships${query ? `?${query}` : ""}`);
        const responseData = response.data;
        return {
            success: true,
            data: {
                data: Array.isArray(responseData.data) ? responseData.data : [],
                meta: normalizePaginationMeta(responseData)
            }
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getAvailableScholarship(id: number | string): Promise<ActionResponse<AvailableScholarshipResource>> {
    try {
        const response = await api.get(`/workspace/scholarships/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createAvailableScholarship(data: AvailableScholarshipData): Promise<ActionResponse<AvailableScholarshipResource>> {
    try {
        const response = await api.post("/workspace/scholarships", data);
        revalidatePath("/[locale]/hr/scholarships/available-scholarships", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateAvailableScholarship(id: number | string, data: AvailableScholarshipData): Promise<ActionResponse<AvailableScholarshipResource>> {
    try {
        const response = await api.put(`/workspace/scholarships/${id}`, data);
        revalidatePath("/[locale]/hr/scholarships/available-scholarships", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteAvailableScholarships(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/scholarships", { data: { ids } });
        revalidatePath("/[locale]/hr/scholarships/available-scholarships", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

// ==========================================
// SCHOLARSHIP REQUESTS ACTIONS (Backend Endpoint: /workspace/scholarship-requests)
// ==========================================

export async function getScholarshipRequests(query?: string): Promise<ActionResponse<{ data: ScholarshipRequestResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/workspace/scholarship-requests${query ? `?${query}` : ""}`);
        const responseData = response.data;
        return {
            success: true,
            data: {
                data: Array.isArray(responseData.data) ? responseData.data : [],
                meta: normalizePaginationMeta(responseData)
            }
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getScholarshipRequest(id: number | string): Promise<ActionResponse<ScholarshipRequestResource>> {
    try {
        const response = await api.get(`/workspace/scholarship-requests/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createScholarshipRequest(data: ScholarshipRequestData): Promise<ActionResponse<ScholarshipRequestResource>> {
    try {
        const response = await api.post("/workspace/scholarship-requests", data);
        revalidatePath("/[locale]/hr/scholarships/scholarship-requests", "page");
        revalidatePath("/[locale]/hr/employee-requests/scholarship-requests", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateScholarshipRequest(id: number | string, data: ScholarshipRequestData): Promise<ActionResponse<ScholarshipRequestResource>> {
    try {
        const response = await api.put(`/workspace/scholarship-requests/${id}`, data);
        revalidatePath("/[locale]/hr/scholarships/scholarship-requests", "page");
        revalidatePath("/[locale]/hr/employee-requests/scholarship-requests", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteScholarshipRequests(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/scholarship-requests", { data: { ids } });
        revalidatePath("/[locale]/hr/scholarships/scholarship-requests", "page");
        revalidatePath("/[locale]/hr/employee-requests/scholarship-requests", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateScholarshipRequestStatus(
    request: ScholarshipRequestResource,
    status: "pending" | "approved" | "rejected"
): Promise<ActionResponse<ScholarshipRequestResource>> {
    try {
        const response = await api.put(`/workspace/scholarship-requests/${request.id}`, {
            user_id: request.user_id,
            scholarship_id: request.scholarship_id ?? null,
            title: request.title,
            description: request.description,
            price: request.price,
            discount_percentage: request.discount_percentage,
            duration: request.duration,
            status,
        });
        revalidatePath("/[locale]/hr/scholarships/scholarship-requests", "page");
        revalidatePath("/[locale]/hr/employee-requests/scholarship-requests", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

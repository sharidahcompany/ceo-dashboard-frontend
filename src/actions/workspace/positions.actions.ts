"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

// ==========================================
// TYPES
// ==========================================

export interface PositionResource {
    id: number;
    name: {
        ar: string;
        en: string;
    };
    name_localized: string;
    description?: {
        ar?: string;
        en?: string;
    };
    description_localized?: string;
    status: string;
    department?: {
        id: number;
        name: string;
    };
    benefits?: Array<{
        id: number;
        name: string;
        description: string;
    }>;
    cover?: string;
    created_at: string;
    updated_at: string;
}

export interface PositionData {
    department_id?: number | null;
    name: {
        ar: string;
        en: string;
    };
    description?: {
        ar?: string;
        en?: string;
    };
    benefits?: number[];
    status?: string;
    cover?: File | null;
}

export interface BenefitResource {
    id: number;
    name: {
        ar: string;
        en: string;
    };
    name_localized: string;
    description: {
        ar?: string;
        en?: string;
    };
    description_localized?: string;
}

// ==========================================
// ACTIONS
// ==========================================

export async function getBenefits(): Promise<ActionResponse<BenefitResource[]>> {
    try {
        const response = await api.get("/workspace/benefits");
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getPositions(query?: string): Promise<ActionResponse<{ data: PositionResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/workspace/positions${query ? `?${query}` : ""}`);
        const responseData = response.data;
        return {
            success: true,
            data: {
                data: Array.isArray(responseData.data) ? responseData.data : [],
                meta: responseData.meta
            }
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getPosition(id: number | string): Promise<ActionResponse<PositionResource>> {
    try {
        const response = await api.get(`/workspace/positions/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createPosition(formData: FormData): Promise<ActionResponse<PositionResource>> {
    try {
        const response = await api.post("/workspace/positions", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        revalidatePath("/[locale]/hr/positions", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updatePosition(id: number | string, formData: FormData): Promise<ActionResponse<PositionResource>> {
    try {
        // Laravel PUT request with files requires _method: PUT inside POST request body
        const response = await api.post(`/workspace/positions/update/${id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        revalidatePath("/[locale]/hr/positions", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deletePositions(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/positions", { data: { ids } });
        revalidatePath("/[locale]/hr/positions", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createBenefit(data: {
    name: { ar: string; en: string };
    description: { ar: string; en: string };
}): Promise<ActionResponse<BenefitResource>> {
    try {
        const response = await api.post("/workspace/benefits", data);
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

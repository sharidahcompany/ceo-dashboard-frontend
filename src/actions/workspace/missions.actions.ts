"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";
import { UserResource } from "./user.actions";

export interface MissionStatusField {
    value: string;
    label: string;
}

export interface MissionResource {
    id: number;
    title: string;
    description?: string | null;
    start_datetime?: string | null;
    end_datetime?: string | null;
    actual_start_datetime?: string | null;
    actual_end_datetime?: string | null;
    expense_amount?: string | null;
    approved_by?: number | null;
    approved_by_user?: UserResource | null;
    created_by?: number | null;
    created_by_user?: UserResource | null;
    assignees?: UserResource[];
    assignee_ids?: string[];
    status: MissionStatusField;
    approval_status: MissionStatusField;
    created_at: string;
    updated_at: string;
}

export interface MissionData {
    title: string;
    description?: string | null;
    start_datetime?: string | null;
    end_datetime?: string | null;
    actual_start_datetime?: string | null;
    actual_end_datetime?: string | null;
    expense_amount?: number | null;
    assignee_ids?: string[];
    status?: string;
    approval_status?: string;
}

export async function getMissions(query?: string): Promise<ActionResponse<{ data: MissionResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/workspace/missions${query ? `?${query}` : ""}`);
        const responseData = response.data;
        return {
            success: true,
            data: {
                data: Array.isArray(responseData.data) ? responseData.data : [],
                meta: responseData.meta,
            },
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getMission(id: number | string): Promise<ActionResponse<MissionResource>> {
    try {
        const response = await api.get(`/workspace/missions/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createMission(data: MissionData): Promise<ActionResponse<MissionResource>> {
    try {
        const response = await api.post("/workspace/missions", data);
        revalidatePath("/[locale]/hr/missions", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateMission(id: number | string, data: MissionData): Promise<ActionResponse<MissionResource>> {
    try {
        const response = await api.put(`/workspace/missions/${id}`, data);
        revalidatePath("/[locale]/hr/missions", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteMissions(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/missions", { data: { ids } });
        revalidatePath("/[locale]/hr/missions", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

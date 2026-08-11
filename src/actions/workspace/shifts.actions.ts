"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";
import { UserResource } from "./user.actions";
import { BranchResource } from "@/actions/company-spirit/branch.actions";

export interface ShiftResource {
    id: number;
    branch_id?: number | null;
    branch?: BranchResource | null;
    name: string;
    work_days: Array<{
        value: string;
        label: string;
    }>;
    start_time: string;
    end_time: string;
    grace_period: number;
    overtime_allowed: boolean;
    overtime_rate: number;
    deduction_rate: number;
    users?: UserResource[];
    user_ids?: string[];
    created_at: string;
    updated_at: string;
    job_dispatched?: boolean;
    job_dispatched_at?: string | null;
}

export interface ShiftData {
    branch_id?: number | string | null;
    name: string;
    work_days?: string[];
    start_time: string;
    end_time: string;
    grace_period?: number;
    overtime_allowed?: boolean;
    overtime_rate?: number;
    deduction_rate?: number;
    user_ids?: string[];
}

export async function getShifts(query?: string, tenantId?: string): Promise<ActionResponse<{ data: ShiftResource[]; meta?: any }>> {
    try {
        const response = await api.get(
            `/workspace/shifts${query ? `?${query}` : ""}`,
            tenantId ? { headers: { "X-Tenant": tenantId } } : undefined,
        );
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

export async function getShift(id: number | string): Promise<ActionResponse<ShiftResource>> {
    try {
        const response = await api.get(`/workspace/shifts/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createShift(data: ShiftData): Promise<ActionResponse<ShiftResource>> {
    try {
        const response = await api.post("/workspace/shifts", data);
        revalidatePath("/[locale]/hr/shifts", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateShift(id: number | string, data: ShiftData): Promise<ActionResponse<ShiftResource>> {
    try {
        const response = await api.put(`/workspace/shifts/${id}`, data);
        revalidatePath("/[locale]/hr/shifts", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteShifts(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/shifts", { data: { ids } });
        revalidatePath("/[locale]/hr/shifts", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

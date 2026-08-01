"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";
import { UserResource } from "./user.actions";

export interface AttendancePermissionStatus {
    value: string;
    label: string;
}

export interface AttendancePermissionResource {
    id: number;
    user_id: number;
    user?: UserResource;
    approved_by?: number | null;
    approved_by_user?: UserResource | null;
    deduct_from_balance: boolean;
    reason?: string | null;
    start_datetime: string;
    end_datetime: string;
    status: AttendancePermissionStatus;
    created_at: string;
    updated_at: string;
}

export interface AttendancePermissionData {
    user_id: string;
    reason?: string | null;
    start_datetime?: string | null;
    end_datetime?: string | null;
    deduct_from_balance?: boolean;
    status?: string;
}

export async function getAttendancePermissions(
    query?: string
): Promise<ActionResponse<{ data: AttendancePermissionResource[]; meta?: any }>> {
    try {
        const response = await api.get(
            `/workspace/attendance-permissions${query ? `?${query}` : ""}`
        );
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

export async function getAttendancePermission(
    id: number | string
): Promise<ActionResponse<AttendancePermissionResource>> {
    try {
        const response = await api.get(`/workspace/attendance-permissions/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createAttendancePermission(
    data: AttendancePermissionData
): Promise<ActionResponse<AttendancePermissionResource>> {
    try {
        const response = await api.post("/workspace/attendance-permissions", data);
        revalidatePath("/[locale]/hr/attendance-permissions", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateAttendancePermission(
    id: number | string,
    data: AttendancePermissionData
): Promise<ActionResponse<AttendancePermissionResource>> {
    try {
        const response = await api.put(`/workspace/attendance-permissions/${id}`, data);
        revalidatePath("/[locale]/hr/attendance-permissions", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteAttendancePermissions(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/attendance-permissions", { data: { ids } });
        revalidatePath("/[locale]/hr/attendance-permissions", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

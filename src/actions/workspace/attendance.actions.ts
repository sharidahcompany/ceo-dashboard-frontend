"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";
import { UserResource } from "./user.actions";
import { ShiftResource } from "./shifts.actions";

export interface AttendanceResource {
    id: number;
    user_id: string;
    shift_id?: number | null;
    attendance_date: string;
    shift_start_at?: string | null;
    shift_end_at?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    late_minutes?: number | null;
    overtime_minutes?: number | null;
    status: string;
    status_label: string;
    user?: UserResource;
    shift?: ShiftResource;
    created_at: string;
    updated_at: string;
}

export interface AttendanceData {
    user_id: string;
    attendance_date?: string;
    shift_start_at?: string;
    shift_end_at?: string;
    check_in?: string | null;
    check_out?: string | null;
    late_minutes?: number;
    overtime_minutes?: number;
    status?: string;
}

export async function getAttendances(query?: string): Promise<ActionResponse<{ data: AttendanceResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/workspace/attendances${query ? `?${query}` : ""}`);
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

export async function getAttendance(id: number | string): Promise<ActionResponse<AttendanceResource>> {
    try {
        const response = await api.get(`/workspace/attendances/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createAttendance(data: AttendanceData): Promise<ActionResponse<AttendanceResource>> {
    try {
        const response = await api.post("/workspace/attendances", data);
        revalidatePath("/[locale]/hr/attendance", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateAttendance(id: number | string, data: AttendanceData): Promise<ActionResponse<AttendanceResource>> {
    try {
        const response = await api.put(`/workspace/attendances/${id}`, data);
        revalidatePath("/[locale]/hr/attendance", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteAttendances(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/attendances", { data: { ids } });
        revalidatePath("/[locale]/hr/attendance", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

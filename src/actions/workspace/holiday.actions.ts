"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export interface HolidayResource {
    id: number;
    name: string;
    date: string; // YYYY-MM-DD
    created_at: string;
    updated_at: string;
}

export interface HolidayData {
    name: string;
    date: string;
}

export async function getHolidays(query?: string): Promise<ActionResponse<{ data: HolidayResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/workspace/holidays${query ? `?${query}` : ""}`);
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

export async function getHoliday(id: number | string): Promise<ActionResponse<HolidayResource>> {
    try {
        const response = await api.get(`/workspace/holidays/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createHoliday(data: HolidayData): Promise<ActionResponse<HolidayResource>> {
    try {
        const response = await api.post("/workspace/holidays", data);
        revalidatePath("/[locale]/hr/holidays", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateHoliday(id: number | string, data: HolidayData): Promise<ActionResponse<HolidayResource>> {
    try {
        const response = await api.put(`/workspace/holidays/${id}`, data);
        revalidatePath("/[locale]/hr/holidays", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteHolidays(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/holidays", { data: { ids } });
        revalidatePath("/[locale]/hr/holidays", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

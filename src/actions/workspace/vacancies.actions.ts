"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";
import { PositionResource } from "./positions.actions";

export interface VacancyResource {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    position?: PositionResource;
    created_at: string;
    updated_at: string;
}

export interface VacancyData {
    position_id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
}

export async function getVacancies(query?: string): Promise<ActionResponse<{ data: VacancyResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/workspace/vacancies${query ? `?${query}` : ""}`);
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

export async function getVacancy(id: number | string): Promise<ActionResponse<VacancyResource>> {
    try {
        const response = await api.get(`/workspace/vacancies/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createVacancy(data: VacancyData): Promise<ActionResponse<VacancyResource>> {
    try {
        const response = await api.post("/workspace/vacancies", data);
        revalidatePath("/[locale]/hr/vacancies", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateVacancy(id: number | string, data: VacancyData): Promise<ActionResponse<VacancyResource>> {
    try {
        const response = await api.put(`/workspace/vacancies/${id}`, data);
        revalidatePath("/[locale]/hr/vacancies", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteVacancies(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/vacancies", { data: { ids } });
        revalidatePath("/[locale]/hr/vacancies", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

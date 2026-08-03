"use server";

import api from "@/lib/api";
import { ApiResponse } from "@/types/common.types";
import { revalidatePath } from "next/cache";

export type GoalResource = {
    id: string | number;
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    title_localized: string;
    description_localized: string;
    media_url?: string;
};

import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export async function getGoals(): Promise<ActionResponse<ApiResponse<GoalResource[]>>> {
    try {
        const res = await api.get<ApiResponse<GoalResource[]>>("/workspace/goals");
        return { success: true, data: res.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createGoal(formData: FormData): Promise<ActionResponse<ApiResponse<GoalResource>>> {
    try {
        const res = await api.post<ApiResponse<GoalResource>>("/workspace/goals", formData);
        revalidatePath('/[locale]/company-spirit/goals', 'page');
        return { success: true, data: res.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateGoal(id: string | number, formData: FormData): Promise<ActionResponse<ApiResponse<GoalResource>>> {
    try {
        if (!formData.has("_method")) {
            formData.append("_method", "PUT");
        }
        const res = await api.post<ApiResponse<GoalResource>>(`/workspace/goals/${id}`, formData);
        revalidatePath('/[locale]/company-spirit/goals', 'page');
        return { success: true, data: res.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteGoal(ids: string[] | number[]): Promise<ActionResponse<ApiResponse>> {
    try {
        const res = await api.delete<ApiResponse>(`/workspace/goals`, { data: { ids } });
        revalidatePath('/[locale]/company-spirit/goals', 'page');
        return { success: true, data: res.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}
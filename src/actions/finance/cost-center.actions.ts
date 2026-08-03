"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";

export interface CostCenterResource {
    id: number;
    name: Record<string, string>;
    name_localized: string | null;
}

export interface CostCenterFormData {
    name: {
        ar: string;
        en: string;
    };
}

export interface CostCentersApiResponse {
    data: CostCenterResource[];
    meta: PaginationMeta;
}

export interface CostCenterApiResponse {
    data: CostCenterResource;
    message?: string;
}

export async function getCostCenters(
    params: Record<string, any> = {}
): Promise<ActionResponse<CostCentersApiResponse>> {
    try {
        const response = await api.get<CostCentersApiResponse>("/finance/cost-centers", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getCostCenter(
    id: string | number
): Promise<ActionResponse<CostCenterResource>> {
    try {
        const response = await api.get<CostCenterApiResponse>(`/finance/cost-centers/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createCostCenter(
    data: CostCenterFormData
): Promise<ActionResponse<CostCenterResource>> {
    try {
        const response = await api.post<CostCenterApiResponse>("/finance/cost-centers", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateCostCenter(
    id: string | number,
    data: CostCenterFormData
): Promise<ActionResponse<CostCenterResource>> {
    try {
        const response = await api.put<CostCenterApiResponse>(`/finance/cost-centers/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteCostCenters(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/cost-centers", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

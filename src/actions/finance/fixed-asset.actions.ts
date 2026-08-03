"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export type FixedAssetStatus = "DRAFT" | "REGISTERED";

export interface FixedAssetAccountRef {
    id: number;
    label: Record<string, string>;
}

export interface FixedAssetResource {
    id: number;
    status: {
        value: FixedAssetStatus;
        label: string;
    };
    asset_number: string;
    name: string;
    purchase_date: string | null;
    purchase_cost: number | string;
    salvage_value: number | string;
    life_in_months: number;
    depreciation_start_month: string | null;
    current_book_value: number | string;
    depreciated_until: string | null;
    fixed_asset_account: FixedAssetAccountRef | null;
    depreciation_account: FixedAssetAccountRef | null;
    accumulated_depreciation_account: FixedAssetAccountRef | null;
    notes: string | null;
    cost_center_id: number | null;
    project_id: number | null;
}

export interface FixedAssetFormData {
    asset_number: string;
    name: string;
    purchase_date: string;
    purchase_cost: number | string;
    salvage_value: number | string;
    life_in_months: number | string;
    depreciation_start_month: string;
    fixed_asset_account_id: number | string;
    depreciation_account_id: number | string;
    accumulated_depreciation_account_id: number | string;
    notes?: string;
    cost_center_id?: number | string | null;
    project_id?: number | string | null;
}

export interface FixedAssetsApiResponse {
    data: FixedAssetResource[];
}

export interface FixedAssetApiResponse {
    data: FixedAssetResource;
    message?: string;
}

export async function getFixedAssets(
    query?: string
): Promise<ActionResponse<{ data: FixedAssetResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/finance/fixed-assets${query ? `?${query}` : ""}`);
        const responseData = response.data;
        return {
            success: true,
            data: {
                data: Array.isArray(responseData.data) ? responseData.data : [],
                meta: normalizePaginationMeta(responseData),
            },
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getFixedAsset(
    id: string | number
): Promise<ActionResponse<FixedAssetResource>> {
    try {
        const response = await api.get<FixedAssetApiResponse>(`/finance/fixed-assets/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createFixedAsset(
    data: FixedAssetFormData
): Promise<ActionResponse<void>> {
    try {
        const response = await api.post("/finance/fixed-assets", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateFixedAsset(
    id: string | number,
    data: FixedAssetFormData
): Promise<ActionResponse<void>> {
    try {
        const response = await api.put(`/finance/fixed-assets/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteFixedAssets(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/fixed-assets", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

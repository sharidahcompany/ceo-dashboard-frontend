"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";
import { WarehouseResource } from "./warehouse.actions";
import { ItemResource } from "./item.actions";
import { AccountResource } from "./account.actions";

export type InventoryAdjustmentStatus = "DRAFT" | "APPROVED";

export interface InventoryAdjustmentResource {
    id: number;
    status: InventoryAdjustmentStatus | null;
    status_label: string | null;
    reference: string | null;
    date: string | null;
    warehouse_id: number;
    warehouse_name?: WarehouseResource;
    item_id: number;
    item_name?: ItemResource;
    line_item_description: string | null;
    qty: number | string;
    inventory_value: number | string;
    account_id: number | null;
    account?: AccountResource;
    total_adjustment_amount: number | string | null;
    created_at: string;
}

export interface InventoryAdjustmentFormData {
    status: InventoryAdjustmentStatus;
    reference?: string;
    date: string;
    warehouse_id: number | string;
    item_id: number | string;
    line_item_description?: string;
    qty: number | string;
    inventory_value: number | string;
    account_id?: number | string | null;
    total_adjustment_amount?: number | string;
}

export interface InventoryAdjustmentsApiResponse {
    data: InventoryAdjustmentResource[];
    meta: PaginationMeta;
}

export interface InventoryAdjustmentApiResponse {
    data: InventoryAdjustmentResource;
    message?: string;
}

export async function getInventoryAdjustments(
    query?: string
): Promise<ActionResponse<{ data: InventoryAdjustmentResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/finance/inventory-adjustments${query ? `?${query}` : ""}`);
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

export async function getInventoryAdjustment(
    id: string | number
): Promise<ActionResponse<InventoryAdjustmentResource>> {
    try {
        const response = await api.get<InventoryAdjustmentApiResponse>(`/finance/inventory-adjustments/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createInventoryAdjustment(
    data: InventoryAdjustmentFormData
): Promise<ActionResponse<InventoryAdjustmentResource>> {
    try {
        const response = await api.post<InventoryAdjustmentApiResponse>("/finance/inventory-adjustments", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateInventoryAdjustment(
    id: string | number,
    data: InventoryAdjustmentFormData
): Promise<ActionResponse<InventoryAdjustmentResource>> {
    try {
        const response = await api.put<InventoryAdjustmentApiResponse>(`/finance/inventory-adjustments/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteInventoryAdjustments(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/inventory-adjustments", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

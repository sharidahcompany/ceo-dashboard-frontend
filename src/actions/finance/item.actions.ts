"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";
import { WarehouseResource } from "./warehouse.actions";
import { AccountResource } from "./account.actions";

export interface ItemResource {
    id: number;
    image: string | null;
    sku: string | null;
    name: Record<string, string>;
    name_localized: string | null;
    description: Record<string, string> | null;
    description_localized: string | null;
    unit_cost: number | string | null;
    unit_price: number | string | null;
    quantity: number | string | null;
    avg_unit_cost: number | string | null;
    inventory_value: number | string | null;
    measurement_unit: string | null;
    expense_account_id: number | null;
    expense_account?: AccountResource;
    revenue_account_id: number | null;
    revenue_account?: AccountResource;
    warehouse_id: number | null;
    warehouse?: WarehouseResource;
    created_at: string;
}

export interface ItemFormData {
    sku?: string;
    image?: File | string | null;
    name: {
        ar: string;
        en: string;
    };
    description?: {
        ar?: string;
        en?: string;
    };
    unit_cost?: number | string;
    unit_price?: number | string;
    expense_account?: number | string | null;
    revenue_account?: number | string | null;
    quantity?: number | string;
    avg_unit_cost?: number | string;
    inventory_value?: number | string;
    measurement_unit?: string;
    warehouse_id?: number | string | null;
    show_on_site?: boolean;
}

export interface ItemsApiResponse {
    data: ItemResource[];
    meta: PaginationMeta;
}

export interface ItemApiResponse {
    data: ItemResource;
    message?: string;
}

export async function getItems(
    params: Record<string, any> = {}
): Promise<ActionResponse<ItemsApiResponse>> {
    try {
        const response = await api.get<ItemsApiResponse>("/finance/items", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getItem(
    id: string | number
): Promise<ActionResponse<ItemResource>> {
    try {
        const response = await api.get<ItemApiResponse>(`/finance/items/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createItem(
    formData: FormData | ItemFormData | Record<string, any>
): Promise<ActionResponse<ItemResource>> {
    try {
        const response = await api.post<ItemApiResponse>("/finance/items", formData);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateItem(
    id: string | number,
    formData: FormData | ItemFormData | Record<string, any>
): Promise<ActionResponse<ItemResource>> {
    try {
        let response;
        if (formData instanceof FormData) {
            if (!formData.has("_method")) {
                formData.append("_method", "PUT");
            }
            response = await api.post<ItemApiResponse>(`/finance/items/${id}`, formData);
        } else {
            response = await api.put<ItemApiResponse>(`/finance/items/${id}`, formData);
        }

        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteItems(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/items", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

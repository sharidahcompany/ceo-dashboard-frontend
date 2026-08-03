"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";

export interface WarehouseResource {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    building_number: string | null;
    street: string | null;
    district: string | null;
    city: string | null;
    postal_code: string | null;
    account_id: number;
    account?: any;
    created_at: string;
}

export interface WarehouseFormData {
    name: string;
    phone?: string;
    email?: string;
    building_number?: string;
    street?: string;
    district?: string;
    city?: string;
    postal_code?: string;
    account_id: number | string;
}

export interface WarehousesApiResponse {
    data: WarehouseResource[];
    meta?: PaginationMeta;
}

export interface WarehouseApiResponse {
    data: WarehouseResource;
    message?: string;
}

export async function getWarehouses(
    params: Record<string, any> = {}
): Promise<ActionResponse<WarehousesApiResponse>> {
    try {
        const response = await api.get<WarehousesApiResponse>("/finance/warehouses", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getWarehouse(
    id: string | number
): Promise<ActionResponse<WarehouseResource>> {
    try {
        const response = await api.get<WarehouseApiResponse>(`/finance/warehouses/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createWarehouse(
    data: WarehouseFormData
): Promise<ActionResponse<WarehouseResource>> {
    try {
        const response = await api.post<WarehouseApiResponse>("/finance/warehouses", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateWarehouse(
    id: string | number,
    data: WarehouseFormData
): Promise<ActionResponse<WarehouseResource>> {
    try {
        const response = await api.put<WarehouseApiResponse>(`/finance/warehouses/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteWarehouses(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/warehouses", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

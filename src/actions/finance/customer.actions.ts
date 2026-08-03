"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";

export interface CustomerResource {
    id: number;
    name: Record<string, string>;
    name_localized: string | null;
    phone: string | null;
    email: string | null;
    is_vat_registered: boolean;
    tax_number: string | null;
    building_number: string | null;
    street: string | null;
    district: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
    user_id: number | null;
    created_at: string;
}

export interface CustomerFormData {
    user_id?: number | string | null;
    name: {
        ar: string;
        en: string;
    };
    phone?: string;
    email?: string;
    is_vat_registered?: boolean;
    tax_number?: string;
    building_number?: string;
    street?: string;
    district?: string;
    city?: string;
    postal_code?: string;
    country?: string;
}

export interface CustomersApiResponse {
    data: CustomerResource[];
    meta: PaginationMeta;
}

export interface CustomerApiResponse {
    data: CustomerResource;
    message?: string;
}

export async function getCustomers(
    params: Record<string, any> = {}
): Promise<ActionResponse<CustomersApiResponse>> {
    try {
        const response = await api.get<CustomersApiResponse>("/finance/customers", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getCustomer(
    id: string | number
): Promise<ActionResponse<CustomerResource>> {
    try {
        const response = await api.get<CustomerApiResponse>(`/finance/customers/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createCustomer(
    data: CustomerFormData
): Promise<ActionResponse<CustomerResource>> {
    try {
        const response = await api.post<CustomerApiResponse>("/finance/customers", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateCustomer(
    id: string | number,
    data: CustomerFormData
): Promise<ActionResponse<CustomerResource>> {
    try {
        const response = await api.put<CustomerApiResponse>(`/finance/customers/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteCustomers(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/customers", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

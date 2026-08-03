"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";

export type TaxType = "OUT_OF_SCOPE" | "REVERSE_CHARGE" | "PURCHASES" | "SALES";

export interface TaxRateResource {
    id: number;
    name: Record<string, string>;
    name_localized: string | null;
    tax_type: {
        value: TaxType | null;
        label: string | null;
    };
    tax_rate: number | string;
    description: string | Record<string, string> | null;
    is_system: boolean;
}

export interface TaxRateFormData {
    name: {
        ar: string;
        en: string;
    };
    tax_type: TaxType;
    tax_rate: number | string;
    description?: {
        ar?: string;
        en?: string;
    };
}

export interface TaxRatesApiResponse {
    data: TaxRateResource[];
    meta: PaginationMeta;
}

export interface TaxRateApiResponse {
    data: TaxRateResource;
    message?: string;
}

export async function getTaxRates(
    params: Record<string, any> = {}
): Promise<ActionResponse<TaxRatesApiResponse>> {
    try {
        const response = await api.get<TaxRatesApiResponse>("/finance/tax-rates", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getTaxRate(
    id: string | number
): Promise<ActionResponse<TaxRateResource>> {
    try {
        const response = await api.get<TaxRateApiResponse>(`/finance/tax-rates/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createTaxRate(
    data: TaxRateFormData
): Promise<ActionResponse<TaxRateResource>> {
    try {
        const response = await api.post<TaxRateApiResponse>("/finance/tax-rates", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateTaxRate(
    id: string | number,
    data: TaxRateFormData
): Promise<ActionResponse<TaxRateResource>> {
    try {
        const response = await api.put<TaxRateApiResponse>(`/finance/tax-rates/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteTaxRates(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/tax-rates", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

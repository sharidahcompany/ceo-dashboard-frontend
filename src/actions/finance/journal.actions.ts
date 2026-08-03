"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";

export type JournalStatus = "DRAFT" | "POSTED";

export interface JournalLineItemResource {
    id: number;
    account_id: number;
    description: string | null;
    currency: string;
    exchange_rate: number | string;
    debit: number | string | null;
    credit: number | string | null;
    debit_dc: number | string | null;
    credit_dc: number | string | null;
    tax_rate_id: number | null;
    customer_id: number | null;
    project_id: number | null;
    branch_id: number | null;
    cost_center_id: number | null;
}

export interface JournalResource {
    id: number;
    status: {
        value: JournalStatus | null;
        label: string | null;
    };
    date: string;
    reference: string | null;
    notes: string | null;
    items?: JournalLineItemResource[];
    totals?: {
        debit: number;
        credit: number;
        balance: number;
        is_balanced: boolean;
    };
    status_flags?: {
        is_balanced: boolean;
        is_posted: boolean;
    };
    journalable_type: string | null;
    journalable_id: number | null;
    journalable?: any;
}

export interface JournalLineItemFormData {
    account_id: number | string;
    description?: string;
    currency: string;
    exchange_rate: number | string;
    debit?: number | string;
    credit?: number | string;
    debit_dc?: number | string;
    credit_dc?: number | string;
    tax_rate_id?: number | string | null;
    customer_id?: number | string | null;
    project_id?: number | string | null;
    branch_id?: number | string | null;
    cost_center_id?: number | string | null;
}

export interface JournalFormData {
    status: JournalStatus;
    date: string;
    reference?: string;
    notes?: string;
    items: JournalLineItemFormData[];
}

export interface JournalsApiResponse {
    data: JournalResource[];
    meta: PaginationMeta;
}

export interface JournalApiResponse {
    data: JournalResource;
    message?: string;
}

export async function getJournals(
    query?: string
): Promise<ActionResponse<{ data: JournalResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/finance/journals${query ? `?${query}` : ""}`);
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

export async function getJournal(
    id: string | number
): Promise<ActionResponse<JournalResource>> {
    try {
        const response = await api.get<JournalApiResponse>(`/finance/journals/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createJournal(
    data: JournalFormData
): Promise<ActionResponse<JournalResource>> {
    try {
        const response = await api.post<JournalApiResponse>("/finance/journals", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateJournal(
    id: string | number,
    data: JournalFormData
): Promise<ActionResponse<JournalResource>> {
    try {
        const response = await api.put<JournalApiResponse>(`/finance/journals/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteJournals(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/journals", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

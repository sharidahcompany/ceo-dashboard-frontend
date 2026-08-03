"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export type DebitNoteStatus = "DRAFT" | "APPROVED" | "PAID";
export type TaxAmountType = "EXCLUSIVE" | "INCLUSIVE";

export interface DebitNoteLineItemResource {
    id: number;
    line_itemable_id: number;
    line_itemable_type: string;
    description: string;
    quantity: number;
    price: number;
    item_id: number | null;
    tax_rate_id: number | null;
    cost_center_id: number | null;
    discount_percent: number;
    item?: any;
    tax_rate?: any;
    cost_center?: any;
    created_at: string;
    updated_at: string;
}

export interface DebitNoteResource {
    id: number;
    status: DebitNoteStatus;
    debit_note_number: string | null;
    customer_id: number;
    currency: string;
    exchange_rate: number;
    date: string;
    purchase_order: string | null;
    reference: string | null;
    project_id: number | null;
    warehouse_id: number | null;
    tax_amount_type: TaxAmountType;
    notes: string | null;
    subtotal: number;
    discount_exec_vat: number;
    vat: number;
    total: number;
    net_due: number;
    items?: DebitNoteLineItemResource[];
    customer?: any;
    project?: any;
    warehouse?: any;
    created_at: string;
    updated_at: string;
}

export interface DebitNoteLineItemFormData {
    description: string;
    quantity: number | string;
    price: number | string;
    item_id?: number | string | null;
    tax_rate_id?: number | string | null;
    cost_center_id?: number | string | null;
    discount_percent?: number | string;
}

export interface DebitNoteFormData {
    status?: DebitNoteStatus;
    customer_id: number | string;
    debit_note_number?: string;
    currency: string;
    exchange_rate: number | string;
    date: string;
    purchase_order?: string;
    reference?: string;
    project_id?: number | string | null;
    warehouse_id?: number | string | null;
    tax_amount_type: TaxAmountType;
    notes?: string;
    items: DebitNoteLineItemFormData[];
}

export interface DebitNotesApiResponse {
    data: DebitNoteResource[];
}

export interface DebitNoteApiResponse {
    data: DebitNoteResource;
    message?: string;
}

export async function getDebitNotes(
    query?: string
): Promise<ActionResponse<{ data: DebitNoteResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/finance/debit-notes${query ? `?${query}` : ""}`);
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

export async function getDebitNote(
    id: string | number
): Promise<ActionResponse<DebitNoteResource>> {
    try {
        const response = await api.get<{ data: DebitNoteResource }>(`/finance/debit-notes/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createDebitNote(
    data: DebitNoteFormData
): Promise<ActionResponse<DebitNoteResource>> {
    try {
        const response = await api.post<DebitNoteApiResponse>("/finance/debit-notes", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateDebitNote(
    id: string | number,
    data: DebitNoteFormData
): Promise<ActionResponse<DebitNoteResource>> {
    try {
        const response = await api.put<DebitNoteApiResponse>(`/finance/debit-notes/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteDebitNotes(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/debit-notes", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

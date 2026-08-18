"use server";

import api from "@/lib/api";
import { getErrorMessage, getRowErrors, normalizePaginationMeta, extractFileDownload, FileDownload } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export type CreditNoteStatus = "DRAFT" | "APPROVED" | "PAID";
export type TaxAmountType = "EXCLUSIVE" | "INCLUSIVE";

export interface CreditNoteLineItemResource {
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

export interface CreditNoteResource {
    id: number;
    status: CreditNoteStatus;
    credit_note_number: string | null;
    customer_id: number;
    currency: string;
    exchange_rate: number;
    date: string;
    purchase_order: string | null;
    reference: string | null;
    project_id: number | null;
    warehouse_id: number | null;
    branch_id: number | null;
    tax_amount_type: TaxAmountType;
    notes: string | null;
    language: "en" | "ar";
    pdf_url: string | null;
    subtotal: number;
    discount_exec_vat: number;
    vat: number;
    total: number;
    net_due: number;
    items?: CreditNoteLineItemResource[];
    customer?: any;
    project?: any;
    warehouse?: any;
    branch?: any;
    created_at: string;
    updated_at: string;
}

export interface CreditNoteLineItemFormData {
    description: string;
    quantity: number | string;
    price: number | string;
    item_id?: number | string | null;
    tax_rate_id?: number | string | null;
    cost_center_id?: number | string | null;
    discount_percent?: number | string;
}

export interface CreditNoteFormData {
    status?: CreditNoteStatus;
    customer_id: number | string;
    credit_note_number?: string;
    currency: string;
    exchange_rate: number | string;
    date: string;
    purchase_order?: string;
    reference?: string;
    project_id?: number | string | null;
    warehouse_id?: number | string | null;
    branch_id?: number | string | null;
    tax_amount_type: TaxAmountType;
    notes?: string;
    language?: "en" | "ar";
    items: CreditNoteLineItemFormData[];
}

export interface CreditNotesApiResponse {
    data: CreditNoteResource[];
}

export interface CreditNoteApiResponse {
    data: CreditNoteResource;
    message?: string;
}

export async function getCreditNotes(
    query?: string
): Promise<ActionResponse<{ data: CreditNoteResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/finance/credit-notes${query ? `?${query}` : ""}`);
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

export async function getCreditNote(
    id: string | number
): Promise<ActionResponse<CreditNoteResource>> {
    try {
        const response = await api.get<{ data: CreditNoteResource }>(`/finance/credit-notes/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createCreditNote(
    data: CreditNoteFormData
): Promise<ActionResponse<CreditNoteResource>> {
    try {
        const response = await api.post<CreditNoteApiResponse>("/finance/credit-notes", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateCreditNote(
    id: string | number,
    data: CreditNoteFormData
): Promise<ActionResponse<CreditNoteResource>> {
    try {
        const response = await api.put<CreditNoteApiResponse>(`/finance/credit-notes/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteCreditNotes(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/credit-notes", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function importCreditNotes(
    file: File
): Promise<ActionResponse<void>> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/finance/credit-notes/import", formData);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error), errors: getRowErrors(error) };
    }
}

export async function exportCreditNotes(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/credit-notes/export", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "credit-notes.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function downloadCreditNoteImportTemplate(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/credit-notes/import-template", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "credit-note-import-template.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function downloadCreditNotePdf(
    id: number | string
): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get(`/finance/credit-notes/${id}/pdf`);
        const { filename, content_type, base64 } = response.data.data;
        return { success: true, data: { filename, contentType: content_type, base64 } };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

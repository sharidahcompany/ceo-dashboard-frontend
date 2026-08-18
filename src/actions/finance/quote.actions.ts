"use server";

import api from "@/lib/api";
import { getErrorMessage, getRowErrors, normalizePaginationMeta, extractFileDownload, FileDownload } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export type QuoteStatus = "DRAFT" | "APPROVED" | "SENT";
export type TaxAmountType = "EXCLUSIVE" | "INCLUSIVE";

export interface QuoteLineItemResource {
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

export interface QuoteResource {
    id: number;
    status: QuoteStatus;
    customer_id: number;
    quote_number: string | null;
    currency: string;
    exchange_rate: number;
    date: string;
    due_date: string;
    purchase_order: string | null;
    reference: string | null;
    project_id: number | null;
    warehouse_id: number | null;
    tax_amount_type: TaxAmountType;
    notes: string | null;
    language: "en" | "ar";
    pdf_url: string | null;
    subtotal: number;
    discount_exec_vat: number;
    vat: number;
    total: number;
    net_due: number;
    created_at: string;
    updated_at: string;
    items?: QuoteLineItemResource[];
    customer?: any;
    project?: any;
    warehouse?: any;
}

export interface QuoteLineItemFormData {
    description: string;
    quantity: number | string;
    price: number | string;
    item_id?: number | string | null;
    tax_rate_id?: number | string | null;
    cost_center_id?: number | string | null;
    discount_percent?: number | string;
}

export interface QuoteFormData {
    status?: QuoteStatus;
    customer_id: number | string;
    quote_number?: string;
    currency: string;
    exchange_rate?: number | string;
    date: string;
    due_date: string;
    purchase_order?: string;
    reference?: string;
    project_id?: number | string | null;
    warehouse_id?: number | string | null;
    tax_amount_type: TaxAmountType;
    notes?: string;
    language?: "en" | "ar";
    items: QuoteLineItemFormData[];
}

export interface QuotesApiResponse {
    data: QuoteResource[];
}

export interface QuoteApiResponse {
    data: QuoteResource;
    message?: string;
}

export async function getQuotes(
    query?: string
): Promise<ActionResponse<{ data: QuoteResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/finance/quotes-and-proformas${query ? `?${query}` : ""}`);
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

export async function getQuote(
    id: string | number
): Promise<ActionResponse<QuoteResource>> {
    try {
        const response = await api.get<{ data: QuoteResource }>(`/finance/quotes-and-proformas/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createQuote(
    data: QuoteFormData
): Promise<ActionResponse<QuoteResource>> {
    try {
        const response = await api.post<QuoteApiResponse>("/finance/quotes-and-proformas", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateQuote(
    id: string | number,
    data: QuoteFormData
): Promise<ActionResponse<QuoteResource>> {
    try {
        const response = await api.put<QuoteApiResponse>(`/finance/quotes-and-proformas/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteQuotes(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/quotes-and-proformas", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function importQuotes(
    file: File
): Promise<ActionResponse<void>> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/finance/quotes-and-proformas/import", formData);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error), errors: getRowErrors(error) };
    }
}

export async function exportQuotes(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/quotes-and-proformas/export", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "quotes.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function downloadQuoteImportTemplate(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/quotes-and-proformas/import-template", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "quote-import-template.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function downloadQuotePdf(
    id: number | string
): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get(`/finance/quotes-and-proformas/${id}/pdf`);
        const { filename, content_type, base64 } = response.data.data;
        return { success: true, data: { filename, contentType: content_type, base64 } };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

"use server";

import api from "@/lib/api";
import { getErrorMessage, getRowErrors, normalizePaginationMeta, extractFileDownload, FileDownload } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export type InvoiceStatus = "DRAFT" | "APPROVED" | "SENT" | "PAID" | "PARTIALLY_PAID";
export type TaxAmountType = "EXCLUSIVE" | "INCLUSIVE";

export interface InvoiceLineItemResource {
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

export interface InvoiceResource {
    id: number;
    status: InvoiceStatus;
    invoice_number: string | null;
    customer_id: number;
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
    subtotal: number;
    discount_exec_vat: number;
    vat: number;
    total: number;
    net_due: number;
    items?: InvoiceLineItemResource[];
    customer?: any;
    project?: any;
    warehouse?: any;
    created_at: string;
    updated_at: string;
}

export interface InvoiceLineItemFormData {
    description: string;
    quantity: number | string;
    price: number | string;
    item_id?: number | string | null;
    tax_rate_id?: number | string | null;
    cost_center_id?: number | string | null;
    discount_percent?: number | string;
}

export interface InvoiceFormData {
    status?: InvoiceStatus;
    customer_id: number | string;
    invoice_number?: string;
    currency: string;
    exchange_rate: number | string;
    date: string;
    due_date: string;
    purchase_order?: string;
    reference?: string;
    project_id?: number | string | null;
    warehouse_id?: number | string | null;
    tax_amount_type: TaxAmountType;
    notes?: string;
    items: InvoiceLineItemFormData[];
}

export interface InvoicesApiResponse {
    data: InvoiceResource[];
}

export interface InvoiceApiResponse {
    data: InvoiceResource;
    message?: string;
}

export async function getInvoices(
    query?: string
): Promise<ActionResponse<{ data: InvoiceResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/finance/invoices${query ? `?${query}` : ""}`);
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

export async function getInvoice(
    id: string | number
): Promise<ActionResponse<InvoiceResource>> {
    try {
        const response = await api.get<{ data: InvoiceResource }>(`/finance/invoices/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createInvoice(
    data: InvoiceFormData
): Promise<ActionResponse<InvoiceResource>> {
    try {
        const response = await api.post<InvoiceApiResponse>("/finance/invoices", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateInvoice(
    id: string | number,
    data: InvoiceFormData
): Promise<ActionResponse<InvoiceResource>> {
    try {
        const response = await api.put<InvoiceApiResponse>(`/finance/invoices/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteInvoices(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/invoices", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function importInvoices(
    file: File
): Promise<ActionResponse<void>> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/finance/invoices/import", formData);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error), errors: getRowErrors(error) };
    }
}

export async function exportInvoices(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/invoices/export", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "invoices.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function downloadInvoiceImportTemplate(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/invoices/import-template", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "invoice-import-template.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

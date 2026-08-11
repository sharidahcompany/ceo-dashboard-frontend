"use server";

import api from "@/lib/api";
import { getErrorMessage, getRowErrors, normalizePaginationMeta, extractFileDownload, FileDownload } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export type CashInvoiceStatus = "DRAFT" | "PAID";
export type TaxAmountType = "EXCLUSIVE" | "INCLUSIVE";

export interface CashInvoiceLineItemResource {
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

export interface CashInvoiceResource {
    id: number;
    status: CashInvoiceStatus;
    invoice_number: string | null;
    account_id: number;
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
    subtotal: number;
    discount_exec_vat: number;
    vat: number;
    total: number;
    net_due: number;
    items?: CashInvoiceLineItemResource[];
    customer?: any;
    account?: any;
    project?: any;
    warehouse?: any;
    branch?: any;
    created_at: string;
    updated_at: string;
}

export interface CashInvoiceLineItemFormData {
    description: string;
    quantity: number | string;
    price: number | string;
    item_id?: number | string | null;
    tax_rate_id?: number | string | null;
    cost_center_id?: number | string | null;
    discount_percent?: number | string;
}

export interface CashInvoiceFormData {
    status?: CashInvoiceStatus;
    customer_id: number | string;
    account_id: number | string;
    invoice_number?: string;
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
    items: CashInvoiceLineItemFormData[];
}

export interface CashInvoicesApiResponse {
    data: CashInvoiceResource[];
}

export interface CashInvoiceApiResponse {
    data: CashInvoiceResource;
    message?: string;
}

export async function getCashInvoices(
    query?: string
): Promise<ActionResponse<{ data: CashInvoiceResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/finance/cash-invoices${query ? `?${query}` : ""}`);
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

export async function getCashInvoice(
    id: string | number
): Promise<ActionResponse<CashInvoiceResource>> {
    try {
        const response = await api.get<{ data: CashInvoiceResource }>(`/finance/cash-invoices/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createCashInvoice(
    data: CashInvoiceFormData
): Promise<ActionResponse<CashInvoiceResource>> {
    try {
        const response = await api.post<CashInvoiceApiResponse>("/finance/cash-invoices", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateCashInvoice(
    id: string | number,
    data: CashInvoiceFormData
): Promise<ActionResponse<CashInvoiceResource>> {
    try {
        const response = await api.put<CashInvoiceApiResponse>(`/finance/cash-invoices/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteCashInvoices(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/cash-invoices", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function importCashInvoices(
    file: File
): Promise<ActionResponse<void>> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/finance/cash-invoices/import", formData);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error), errors: getRowErrors(error) };
    }
}

export async function exportCashInvoices(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/cash-invoices/export", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "cash-invoices.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function downloadCashInvoiceImportTemplate(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/cash-invoices/import-template", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "cash-invoice-import-template.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

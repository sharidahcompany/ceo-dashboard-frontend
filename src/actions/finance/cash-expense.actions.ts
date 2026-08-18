"use server";

import api from "@/lib/api";
import { getErrorMessage, getRowErrors, normalizePaginationMeta, extractFileDownload, FileDownload } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export type CashExpenseStatus = "DRAFT" | "APPROVED" | "SENT" | "PAID" | "PARTIALLY_PAID";
export type TaxAmountType = "EXCLUSIVE" | "INCLUSIVE";

export interface CashExpenseLineItemResource {
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

export interface CashExpenseResource {
    id: number;
    status: CashExpenseStatus;
    bill_number: string | null;
    payment_account_id: number;
    account_id: number;
    customer_id: number;
    currency: string;
    exchange_rate: number;
    date: string;
    due_date: string;
    purchase_order: string | null;
    reference: string | null;
    project_id: number | null;
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
    customer?: any;
    project?: any;
    branch?: any;
    items?: CashExpenseLineItemResource[];
    created_at: string;
    updated_at: string;
}

export interface CashExpenseLineItemFormData {
    description: string;
    quantity: number | string;
    price: number | string;
    item_id?: number | string | null;
    tax_rate_id?: number | string | null;
    cost_center_id?: number | string | null;
    discount_percent?: number | string;
}

export interface CashExpenseFormData {
    status?: CashExpenseStatus;
    customer_id: number | string;
    payment_account_id: number | string;
    account_id: number | string;
    bill_number?: string;
    currency: string;
    exchange_rate: number | string;
    date: string;
    due_date: string;
    purchase_order?: string;
    reference?: string;
    project_id?: number | string | null;
    branch_id?: number | string | null;
    tax_amount_type: TaxAmountType;
    notes?: string;
    language?: "en" | "ar";
    items: CashExpenseLineItemFormData[];
}

export interface CashExpensesApiResponse {
    data: CashExpenseResource[];
}

export interface CashExpenseApiResponse {
    data: CashExpenseResource;
    message?: string;
}

export async function getCashExpenses(
    query?: string
): Promise<ActionResponse<{ data: CashExpenseResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/finance/cash-expenses${query ? `?${query}` : ""}`);
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

export async function getCashExpense(
    id: string | number
): Promise<ActionResponse<CashExpenseResource>> {
    try {
        const response = await api.get<{ data: CashExpenseResource }>(`/finance/cash-expenses/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createCashExpense(
    data: CashExpenseFormData
): Promise<ActionResponse<CashExpenseResource>> {
    try {
        const response = await api.post<CashExpenseApiResponse>("/finance/cash-expenses", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateCashExpense(
    id: string | number,
    data: CashExpenseFormData
): Promise<ActionResponse<CashExpenseResource>> {
    try {
        const response = await api.put<CashExpenseApiResponse>(`/finance/cash-expenses/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteCashExpenses(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/cash-expenses", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function importCashExpenses(
    file: File
): Promise<ActionResponse<void>> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/finance/cash-expenses/import", formData);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error), errors: getRowErrors(error) };
    }
}

export async function exportCashExpenses(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/cash-expenses/export", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "cash-expenses.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function downloadCashExpenseImportTemplate(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/cash-expenses/import-template", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "cash-expense-import-template.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function downloadCashExpensePdf(
    id: number | string
): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get(`/finance/cash-expenses/${id}/pdf`);
        const { filename, content_type, base64 } = response.data.data;
        return { success: true, data: { filename, contentType: content_type, base64 } };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

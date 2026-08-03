"use server";

import api from "@/lib/api";
import { getErrorMessage, getRowErrors, normalizePaginationMeta, extractFileDownload, FileDownload } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export type BillStatus = "DRAFT" | "APPROVED" | "SENT" | "PAID" | "PARTIALLY_PAID";
export type TaxAmountType = "EXCLUSIVE" | "INCLUSIVE";

export interface BillLineItemResource {
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

export interface BillResource {
    id: number;
    status: BillStatus;
    bill_number: string | null;
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
    subtotal: number;
    discount_exec_vat: number;
    vat: number;
    total: number;
    net_due: number;
    items?: BillLineItemResource[];
    customer?: any;
    project?: any;
    branch?: any;
    created_at: string;
    updated_at: string;
}

export interface BillLineItemFormData {
    description: string;
    quantity: number | string;
    price: number | string;
    item_id?: number | string | null;
    tax_rate_id?: number | string | null;
    cost_center_id?: number | string | null;
    discount_percent?: number | string;
}

export interface BillFormData {
    status?: BillStatus;
    customer_id: number | string;
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
    items: BillLineItemFormData[];
}

export interface BillsApiResponse {
    data: BillResource[];
}

export interface BillApiResponse {
    data: BillResource;
    message?: string;
}

export async function getBills(
    query?: string
): Promise<ActionResponse<{ data: BillResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/finance/bills${query ? `?${query}` : ""}`);
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

export async function getBill(
    id: string | number
): Promise<ActionResponse<BillResource>> {
    try {
        const response = await api.get<{ data: BillResource }>(`/finance/bills/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createBill(
    data: BillFormData
): Promise<ActionResponse<BillResource>> {
    try {
        const response = await api.post<BillApiResponse>("/finance/bills", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateBill(
    id: string | number,
    data: BillFormData
): Promise<ActionResponse<BillResource>> {
    try {
        const response = await api.put<BillApiResponse>(`/finance/bills/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteBills(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/bills", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function importBills(
    file: File
): Promise<ActionResponse<void>> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/finance/bills/import", formData);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error), errors: getRowErrors(error) };
    }
}

export async function exportBills(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/bills/export", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "bills.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function downloadBillImportTemplate(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/bills/import-template", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "bill-import-template.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

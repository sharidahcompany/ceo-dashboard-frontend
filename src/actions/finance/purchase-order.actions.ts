"use server";

import api from "@/lib/api";
import { getErrorMessage, getRowErrors, normalizePaginationMeta, extractFileDownload, FileDownload } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export type PurchaseOrderStatus = "DRAFT" | "APPROVED" | "SENT";
export type TaxAmountType = "EXCLUSIVE" | "INCLUSIVE";

export interface PurchaseOrderLineItemResource {
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

export interface PurchaseOrderResource {
    id: number;
    status: PurchaseOrderStatus;
    purchase_order_number: string | null;
    customer_id: number;
    currency: string;
    exchange_rate: number;
    date: string;
    reference: string | null;
    project_id: number | null;
    tax_amount_type: TaxAmountType;
    notes: string | null;
    subtotal: number;
    discount_exec_vat: number;
    vat: number;
    total: number;
    net_due: number;
    items?: PurchaseOrderLineItemResource[];
    customer?: any;
    project?: any;
    created_at: string;
    updated_at: string;
}

export interface PurchaseOrderLineItemFormData {
    description: string;
    quantity: number | string;
    price: number | string;
    item_id?: number | string | null;
    tax_rate_id?: number | string | null;
    cost_center_id?: number | string | null;
    discount_percent?: number | string;
}

export interface PurchaseOrderFormData {
    status?: PurchaseOrderStatus;
    customer_id: number | string;
    purchase_order_number?: string;
    currency: string;
    exchange_rate: number | string;
    date: string;
    reference?: string;
    project_id?: number | string | null;
    tax_amount_type: TaxAmountType;
    notes?: string;
    items: PurchaseOrderLineItemFormData[];
}

export interface PurchaseOrdersApiResponse {
    data: PurchaseOrderResource[];
}

export interface PurchaseOrderApiResponse {
    data: PurchaseOrderResource;
    message?: string;
}

export async function getPurchaseOrders(
    query?: string
): Promise<ActionResponse<{ data: PurchaseOrderResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/finance/purchase-orders${query ? `?${query}` : ""}`);
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

export async function getPurchaseOrder(
    id: string | number
): Promise<ActionResponse<PurchaseOrderResource>> {
    try {
        const response = await api.get<{ data: PurchaseOrderResource }>(`/finance/purchase-orders/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createPurchaseOrder(
    data: PurchaseOrderFormData
): Promise<ActionResponse<PurchaseOrderResource>> {
    try {
        const response = await api.post<PurchaseOrderApiResponse>("/finance/purchase-orders", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updatePurchaseOrder(
    id: string | number,
    data: PurchaseOrderFormData
): Promise<ActionResponse<PurchaseOrderResource>> {
    try {
        const response = await api.put<PurchaseOrderApiResponse>(`/finance/purchase-orders/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deletePurchaseOrders(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/purchase-orders", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function importPurchaseOrders(
    file: File
): Promise<ActionResponse<void>> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/finance/purchase-orders/import", formData);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error), errors: getRowErrors(error) };
    }
}

export async function exportPurchaseOrders(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/purchase-orders/export", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "purchase-orders.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function downloadPurchaseOrderImportTemplate(): Promise<ActionResponse<FileDownload>> {
    try {
        const response = await api.get("/finance/purchase-orders/import-template", { responseType: "arraybuffer" });
        return { success: true, data: extractFileDownload(response, "purchase-order-import-template.xlsx") };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

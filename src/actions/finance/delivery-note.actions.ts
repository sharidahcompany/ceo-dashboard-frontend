"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export type DeliveryNoteStatus = "DRAFT" | "SHIPPED" | "DELIVERED";
export type TaxAmountType = "EXCLUSIVE" | "INCLUSIVE";

export interface DeliveryNoteLineItemResource {
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

export interface DeliveryNoteResource {
    id: number;
    status: DeliveryNoteStatus;
    delivery_note_number: string | null;
    customer_id: number;
    currency: string;
    exchange_rate: number;
    date: string;
    purchase_order: string | null;
    reference: string | null;
    project_id: number | null;
    tax_amount_type: TaxAmountType;
    notes: string | null;
    subtotal: number;
    discount_exec_vat: number;
    vat: number;
    total: number;
    net_due: number;
    items?: DeliveryNoteLineItemResource[];
    customer?: any;
    project?: any;
    created_at: string;
    updated_at: string;
}

export interface DeliveryNoteLineItemFormData {
    description: string;
    quantity: number | string;
    price: number | string;
    item_id?: number | string | null;
    tax_rate_id?: number | string | null;
    cost_center_id?: number | string | null;
    discount_percent?: number | string;
}

export interface DeliveryNoteFormData {
    status?: DeliveryNoteStatus;
    customer_id: number | string;
    delivery_note_number?: string;
    currency: string;
    exchange_rate: number | string;
    date: string;
    purchase_order?: string;
    reference?: string;
    project_id?: number | string | null;
    tax_amount_type: TaxAmountType;
    notes?: string;
    items: DeliveryNoteLineItemFormData[];
}

export interface DeliveryNotesApiResponse {
    data: DeliveryNoteResource[];
}

export interface DeliveryNoteApiResponse {
    data: DeliveryNoteResource;
    message?: string;
}

export async function getDeliveryNotes(
    params: Record<string, any> = {}
): Promise<ActionResponse<DeliveryNoteResource[]>> {
    try {
        const response = await api.get<DeliveryNotesApiResponse>("/finance/delivery-notes", { params });
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getDeliveryNote(
    id: string | number
): Promise<ActionResponse<DeliveryNoteResource>> {
    try {
        const response = await api.get<{ data: DeliveryNoteResource }>(`/finance/delivery-notes/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createDeliveryNote(
    data: DeliveryNoteFormData
): Promise<ActionResponse<DeliveryNoteResource>> {
    try {
        const response = await api.post<DeliveryNoteApiResponse>("/finance/delivery-notes", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateDeliveryNote(
    id: string | number,
    data: DeliveryNoteFormData
): Promise<ActionResponse<DeliveryNoteResource>> {
    try {
        const response = await api.put<DeliveryNoteApiResponse>(`/finance/delivery-notes/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteDeliveryNotes(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/delivery-notes", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

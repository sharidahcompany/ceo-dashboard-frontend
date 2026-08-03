"use server";

import api from "@/lib/api";
import { PaginationMeta } from "@/types/common.types";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

// Matches App\Enums\OrderStatus in the finance-service backend
export type OrderStatusValue = "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED";

export interface OrderCustomerResource {
    id: number;
    name: Record<string, string>;
    name_localized: string | null;
    phone: string | null;
    email: string | null;
    user_id?: string | null;
}

export interface OrderLineItemResource {
    id: number;
    description: string | null;
    quantity: number;
    price: number;
    item_id?: number | null;
}

export interface OrderResource {
    id: number;
    status: OrderStatusValue;
    order_number: string;
    customer_id: number;
    payment_method?: string | null;
    currency?: string | null;
    notes?: string | null;
    building_number?: string | null;
    street?: string | null;
    district?: string | null;
    city?: string | null;
    postal_code?: string | null;
    country?: string | null;
    subtotal: number;
    total: number;
    items?: OrderLineItemResource[];
    customer?: OrderCustomerResource;
    created_at: string;
    updated_at?: string;
}

export interface OrdersApiResponse {
    data: OrderResource[];
    meta: PaginationMeta;
    message?: string;
}

export interface OrderApiResponse {
    data: OrderResource;
    message?: string;
}

// Frontend lives in the website module; the backend serves this resource
// from the finance service under `/finance/orders`.
export async function getOrders(query?: string): Promise<ActionResponse<{ data: OrderResource[]; meta?: any }>> {
    try {
        const response = await api.get<OrdersApiResponse>(`/finance/orders${query ? `?${query}` : ""}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getOrder(id: string | number): Promise<ActionResponse<OrderResource>> {
    try {
        const response = await api.get<OrderApiResponse>(`/finance/orders/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateOrderStatus(
    id: string | number,
    status: OrderStatusValue,
): Promise<ActionResponse<OrderResource>> {
    try {
        const response = await api.put<OrderApiResponse>(`/finance/orders/${id}`, { status });
        revalidatePath("/[locale]/website/orders", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteOrders(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete<{ message?: string }>("/finance/orders", { data: { ids } });
        revalidatePath("/[locale]/website/orders", "page");
        return { success: true, data: undefined, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";

export interface PayrollPaymentResource {
    id: number;
    payroll_id: number;
    payrun_id: number | null;
    payment_date: string;
    amount: number | string;
    currency: string;
    exchange_rate: number | string;
    amount_dc: number | string;
    reference: string | null;
    status: string;
    status_label: string;
}

export interface PayrollPaymentLineItemFormData {
    payroll_id: number | string;
    amount: number | string;
}

export interface PayrollPaymentFormData {
    payment_date: string;
    account_id: number | string;
    currency: string;
    exchange_rate: number | string;
    reference?: string;
    items: PayrollPaymentLineItemFormData[];
}

export interface PayrollPaymentsApiResponse {
    data: PayrollPaymentResource[];
    meta: PaginationMeta;
}

export interface PayrollPaymentApiResponse {
    data: PayrollPaymentResource;
    message?: string;
}

export async function getPayrollPayments(
    query?: string
): Promise<ActionResponse<{ data: PayrollPaymentResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/finance/payroll-payments${query ? `?${query}` : ""}`);
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

export async function getPayrollPayment(
    id: string | number
): Promise<ActionResponse<PayrollPaymentResource>> {
    try {
        const response = await api.get<PayrollPaymentApiResponse>(`/finance/payroll-payments/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createPayrollPayment(
    data: PayrollPaymentFormData
): Promise<ActionResponse<void>> {
    try {
        const response = await api.post("/finance/payroll-payments", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function payRun(
    payrunId: string | number,
    data: PayrollPaymentFormData
): Promise<ActionResponse<void>> {
    try {
        const response = await api.post(`/finance/payruns/${payrunId}/pay`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deletePayrollPayments(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/payroll-payments", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

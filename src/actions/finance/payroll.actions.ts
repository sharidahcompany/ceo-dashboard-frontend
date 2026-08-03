"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";

export type PayrollPaymentStatus = "unpaid" | "partial" | "paid";

export interface PayrollResource {
    id: number;
    user: {
        id: number | null;
        name: string | null;
    };
    employee_name: string | null;
    user_id: number;
    gross_salary: number | string;
    total_deductions: number | string | null;
    net_salary: number | string;
    paid_amount: number | string | null;
    remaining_amount: number | string | null;
    payment_status: PayrollPaymentStatus;
    payment_status_label: string;
}

export interface PayrollFormData {
    payrun_id?: number | string | null;
    user_id: number | string;
    gross_salary: number | string;
    total_deductions?: number | string;
    net_salary: number | string;
    paid_amount?: number | string;
    remaining_amount?: number | string;
    payment_status?: PayrollPaymentStatus;
}

export interface PayrollsApiResponse {
    data: PayrollResource[];
    meta: PaginationMeta;
}

export interface PayrollApiResponse {
    data: PayrollResource;
    message?: string;
}

export async function getPayrolls(
    params: Record<string, any> = {}
): Promise<ActionResponse<PayrollsApiResponse>> {
    try {
        const response = await api.get<PayrollsApiResponse>("/finance/payrolls", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getPayroll(
    id: string | number
): Promise<ActionResponse<PayrollResource>> {
    try {
        const response = await api.get<PayrollApiResponse>(`/finance/payrolls/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createPayroll(
    data: PayrollFormData
): Promise<ActionResponse<PayrollResource>> {
    try {
        const response = await api.post<PayrollApiResponse>("/finance/payrolls", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updatePayroll(
    id: string | number,
    data: PayrollFormData
): Promise<ActionResponse<PayrollResource>> {
    try {
        const response = await api.put<PayrollApiResponse>(`/finance/payrolls/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deletePayrolls(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/payrolls", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

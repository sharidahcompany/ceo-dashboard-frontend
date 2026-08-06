"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";
import { PayrollResource } from "./payroll.actions";

export type PayrunStatus = "draft" | "processed" | "approved" | "paid";

export interface PayrunResource {
    id: number;
    name: string;
    period_start: string;
    period_end: string;
    pay_date: string | null;
    currency: {
        label: string;
        code: string;
        value: string;
        flag: string;
    };
    exchange_rate: number | string;
    total_gross: number | string | null;
    total_deductions: number | string | null;
    total_net: number | string | null;
    status: PayrunStatus;
    status_label: string;
    payrolls?: PayrollResource[];
}

export interface PayrunFormData {
    name: string;
    period_start: string;
    period_end: string;
    pay_date: string;
    currency: string;
    exchange_rate: number | string;
    total_gross: number | string;
    total_deductions: number | string;
    total_net: number | string;
    status?: PayrunStatus;
}

export interface PayrunsApiResponse {
    data: PayrunResource[];
    meta: PaginationMeta;
}

export interface PayrunApiResponse {
    data: PayrunResource;
    message?: string;
}

export async function getPayruns(
    params: Record<string, any> = {}
): Promise<ActionResponse<PayrunsApiResponse>> {
    try {
        const response = await api.get<PayrunsApiResponse>("/finance/payruns", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getPayrun(
    id: string | number
): Promise<ActionResponse<PayrunResource>> {
    try {
        const response = await api.get<PayrunApiResponse>(`/finance/payruns/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createPayrun(
    data: PayrunFormData
): Promise<ActionResponse<PayrunResource>> {
    try {
        const response = await api.post<PayrunApiResponse>("/finance/payruns", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updatePayrun(
    id: string | number,
    data: PayrunFormData
): Promise<ActionResponse<PayrunResource>> {
    try {
        const response = await api.put<PayrunApiResponse>(`/finance/payruns/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deletePayruns(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/payruns", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

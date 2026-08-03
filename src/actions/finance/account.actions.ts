"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export type AccountClassification = "REVENUE" | "EXPENSE" | "ASSET" | "LIABILITY" | "EQUITY";
export type ActivityType = "CASH" | "OPERATING" | "INVESTING" | "FINANCING";

export interface AccountResource {
    id: number;
    level: number;
    account_code: string;
    classification: AccountClassification;
    name: Record<string, string>;
    name_localized: string | null;
    activity: {
        value: ActivityType | null;
        label: string | null;
    };
    parent_id: number | null;
    show_in_expense_claims: boolean;
    bank_account_id: number | null;
    is_locked: boolean;
    is_system: boolean;
    is_payment_enabled: boolean;
    parent?: AccountResource;
    children?: AccountResource[];
}

export interface AccountFormData {
    classification: AccountClassification;
    name: {
        ar: string;
        en: string;
    };
    activity: ActivityType;
    parent_id: number | string;
    show_in_expense_claims?: boolean;
    bank_account_id?: number | string | null;
    is_payment_enabled?: boolean;
}

export interface AccountsApiResponse {
    data: AccountResource[];
}

export interface AccountApiResponse {
    data: AccountResource;
    message?: string;
}

export async function getAccounts(
    params: Record<string, any> = {}
): Promise<ActionResponse<AccountResource[]>> {
    try {
        const response = await api.get<AccountsApiResponse>("/finance/chart-of-accounts", { params });
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getAccount(
    id: string | number
): Promise<ActionResponse<AccountResource>> {
    try {
        const response = await api.get<AccountApiResponse>(`/finance/chart-of-accounts/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createAccount(
    data: AccountFormData
): Promise<ActionResponse<AccountResource>> {
    try {
        const response = await api.post<AccountApiResponse>("/finance/chart-of-accounts", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateAccount(
    id: string | number,
    data: AccountFormData
): Promise<ActionResponse<AccountResource>> {
    try {
        const response = await api.put<AccountApiResponse>(`/finance/chart-of-accounts/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteAccounts(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/chart-of-accounts", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

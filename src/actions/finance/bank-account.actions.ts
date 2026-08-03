"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";

export type BankAccountType = "BANK_ACCOUNT" | "CREDIT_CARD" | "PETTY_CASH";

export interface BankAccountResource {
    id: number;
    name: Record<string, string>;
    name_localized: string | null;
    type: {
        value: BankAccountType | null;
        label: string | null;
    };
    currency: string;
    currency_code: string;
}

export interface BankAccountFormData {
    name: {
        ar: string;
        en: string;
    };
    type: BankAccountType;
    currency: string;
}

export interface BankAccountsApiResponse {
    data: BankAccountResource[];
    meta?: PaginationMeta;
}

export interface BankAccountApiResponse {
    data: BankAccountResource;
    message?: string;
}

export async function getBankAccounts(
    params: Record<string, any> = {}
): Promise<ActionResponse<BankAccountsApiResponse>> {
    try {
        const response = await api.get<BankAccountsApiResponse>("/finance/bank-accounts", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getBankAccount(
    id: string | number
): Promise<ActionResponse<BankAccountResource>> {
    try {
        const response = await api.get<BankAccountApiResponse>(`/finance/bank-accounts/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createBankAccount(
    data: BankAccountFormData
): Promise<ActionResponse<BankAccountResource>> {
    try {
        const response = await api.post<BankAccountApiResponse>("/finance/bank-accounts", data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateBankAccount(
    id: string | number,
    data: BankAccountFormData
): Promise<ActionResponse<BankAccountResource>> {
    try {
        const response = await api.put<BankAccountApiResponse>(`/finance/bank-accounts/${id}`, data);
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteBankAccounts(
    ids: number[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/finance/bank-accounts", { data: { ids } });
        revalidatePath("/[locale]/finance", "layout");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

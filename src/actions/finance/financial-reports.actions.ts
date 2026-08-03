"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export interface ProfitAndLossPeriod {
    period: string;
    revenue: number;
    expenses: number;
    net_profit_loss: number;
}

export interface TrialBalanceRow {
    code: string;
    name: Record<string, string>;
    classification: string;
    debit: number;
    credit: number;
}

export interface TrialBalanceResponse {
    data: TrialBalanceRow[];
    totals: {
        debit: number;
        credit: number;
    };
}

export interface GeneralLedgerLine {
    date: string;
    reference: string | null;
    description: string | null;
    debit: number;
    credit: number;
    account_name: Record<string, string>;
    account_code: string;
    account_id: number;
}

export interface GeneralLedgerResponse {
    data: Record<string, GeneralLedgerLine[]>;
    meta: {
        start_date: string;
        end_date: string;
    };
}

export interface BalanceSheetResponse {
    assets: number;
    liabilities: number;
    equity: {
        capital: number;
        current_earnings: number;
        total_equity: number;
    };
    date: string;
}

export async function getProfitAndLossReport(
    params: { start_month: string; end_month: string }
): Promise<ActionResponse<{ data: ProfitAndLossPeriod[] }>> {
    try {
        const response = await api.get("/finance/financial-reports/profit-and-loss", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getTrialBalance(
    params?: { date?: string }
): Promise<ActionResponse<TrialBalanceResponse>> {
    try {
        const response = await api.get<TrialBalanceResponse>("/finance/financial-reports/trial-balance", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getGeneralLedger(
    params?: { start_date?: string; end_date?: string; account_id?: number | string }
): Promise<ActionResponse<GeneralLedgerResponse>> {
    try {
        const response = await api.get<GeneralLedgerResponse>("/finance/financial-reports/general-ledger", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getBalanceSheet(
    params?: { date?: string }
): Promise<ActionResponse<BalanceSheetResponse>> {
    try {
        const response = await api.get<BalanceSheetResponse>("/finance/financial-reports/balance-sheet", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

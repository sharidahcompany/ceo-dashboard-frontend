"use server";

import api from "@/lib/api";

import { getErrorMessage, RowError } from "@/lib/utils";

export type ActionResponse<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; errors?: RowError[] };

export interface CountryOption {
  iso3: string;
  label: string;
  flag: string;
}

export interface CountryApiResponse {
  data: CountryOption[];
}

export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
}

export interface CurrencyApiResponse {
  data: CurrencyOption[];
}

export async function getCountries(): Promise<ActionResponse<CountryOption[]>> {
  try {
    const response = await api.get<CountryApiResponse>("/auth/countries");
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getCurrencies(): Promise<
  ActionResponse<CurrencyOption[]>
> {
  try {
    const response = await api.get<CurrencyApiResponse>("/auth/currencies");
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

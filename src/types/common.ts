import { useTranslations } from "next-intl";

export type TranslationFunction = ReturnType<typeof useTranslations>;

export interface ApiErrorData {
  message?: string;
  errors?: Record<string, string[]> | null;
}

export interface ActionResponse<T> {
  success: boolean;
  data: T | null;
  status: number;
  error: string | null;
  errors: Record<string, string[]> | null;
  firstError?: string | null;
}

export interface CountryOption {
  iso3: string;
  label: string;
  flag: string;
}

export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
}

"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

export interface MarketingCatalogItem {
  id: number;
  image: string | null;
  sku: string | null;
  catalog_type: string;
  name: Record<string, string> | string;
  name_localized: string | null;
  description: Record<string, string> | null;
  description_localized: string | null;
  unit_price: string | number | null;
  measurement_unit: string | null;
}

interface CatalogResponse {
  data: MarketingCatalogItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CatalogQuery {
  legal_entity_id: number;
  catalog_id: number;
  page: number;
  per_page: number;
  search?: string;
}

export type CatalogResult =
  | { success: true; data: CatalogResponse }
  | { success: false; error: string };

export async function getMarketingCatalogItems(
  query: CatalogQuery,
): Promise<CatalogResult> {
  const {
    legal_entity_id,
    catalog_id,
    page,
    per_page,
    search,
  } = query;

  if (
    !Number.isSafeInteger(legal_entity_id) ||
    legal_entity_id < 1 ||
    !Number.isSafeInteger(catalog_id) ||
    catalog_id < 1 ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(per_page) ||
    per_page < 1 ||
    per_page > 100
  ) {
    return {
      success: false,
      error: "معرفات الكيان والكتالوج أو إعدادات الصفحات غير صالحة.",
    };
  }

  try {
    const response = await api.get<CatalogResponse>(
      "/finance/marketing/catalog-items",
      {
        params: {
          legal_entity_id,
          catalog_id,
          page,
          per_page,
          ...(search?.trim() ? { search: search.trim() } : {}),
        },
      },
    );

    const body = response.data;

    if (
      !Array.isArray(body?.data) ||
      !body?.meta ||
      !Number.isFinite(Number(body.meta.total)) ||
      !Number.isFinite(Number(body.meta.last_page))
    ) {
      return {
        success: false,
        error: "صيغة استجابة كتالوج التسويق غير متوقعة.",
      };
    }

    return { success: true, data: body };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

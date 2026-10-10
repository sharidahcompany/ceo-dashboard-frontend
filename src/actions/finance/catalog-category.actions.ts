"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export interface CatalogCategoryOption {
    id: number;
    legal_entity_id: number;
    parent_id: number | null;
    code: string | null;
    name: string | Record<string, string>;
    is_active: boolean;
}

export async function getCatalogCategories(
    legalEntityId: string | number
): Promise<ActionResponse<CatalogCategoryOption[]>> {
    try {
        const response = await api.get("/finance/catalog-categories", {
            params: {
                legal_entity_id: legalEntityId,
                per_page: 200,
            },
        });

        const body = response.data;
        const rows = Array.isArray(body?.data)
            ? body.data
            : Array.isArray(body?.data?.data)
                ? body.data.data
                : null;

        if (!rows) {
            return {
                success: false,
                error: "صيغة استجابة التصنيفات غير متوقعة.",
            };
        }

        return {
            success: true,
            data: rows.filter(
                (category: CatalogCategoryOption) =>
                    Number(category.legal_entity_id) === Number(legalEntityId)
            ),
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

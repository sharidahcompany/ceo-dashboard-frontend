"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export interface CatalogImportPreview {
    total_rows: number;
    preview: Array<{
        row: number;
        values: Record<string, string>;
        errors: string[];
    }>;
    errors: Array<{
        row: number;
        messages: string[];
    }>;
    error_row_count: number;
    error_report_truncated: boolean;
    database_checked: boolean;
    import_committed: boolean;
}

export async function previewCatalogImport(
    formData: FormData
): Promise<ActionResponse<CatalogImportPreview>> {
    try {
        const response = await api.post<{
            data: CatalogImportPreview;
        }>("/finance/catalog-import/preview", formData);

        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

// CEO_CATALOG_IMPORT_PLANNING_UI_20261009
export interface CatalogImportPlan {
    legal_entity_id: number;
    mode: "create" | "update";
    total_rows: number;
    counts: {
        create: number;
        update: number;
        conflict: number;
    };
    has_conflicts: boolean;
    rows: Array<{
        row: number;
        sku: string | null;
        action: string;
        reason: string | null;
    }>;
    database_modified: false;
    execution_enabled: false;
}

export async function planCatalogImport(
    formData: FormData
): Promise<ActionResponse<CatalogImportPlan>> {
    try {
        const response = await api.post<{ data: CatalogImportPlan }>(
            "/finance/catalog-import/plan",
            formData
        );
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

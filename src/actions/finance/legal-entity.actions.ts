"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export interface FinanceLegalEntity {
    id: number;
    name?: string | Record<string, string>;
    legal_name?: string | Record<string, string>;
    code?: string | null;
    is_active?: boolean;
}

export async function getFinanceLegalEntities():
    Promise<ActionResponse<FinanceLegalEntity[]>> {
    try {
        const response = await api.get(
            "/finance/legal-entities",
            { params: { per_page: 500 } }
        );

        const body = response.data;
        const entities = Array.isArray(body?.data)
            ? body.data
            : Array.isArray(body?.data?.data)
                ? body.data.data
                : [];

        return { success: true, data: entities };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

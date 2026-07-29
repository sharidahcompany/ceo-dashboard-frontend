"use server";

import api from "@/lib/api";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";
import { BuffetCategoryResource } from "./buffet-category.actions";

export type BuffetItemResource = {
    id: number;
    buffet_category_id: number | string;
    name_localized: string | null;
    name: Record<string, string>;
    description_localized?: string | null;
    description?: Record<string, string>;
    price: number | string;
    is_available?: boolean;
    is_vip?: boolean;
    is_active?: boolean;
    icon?: string | null;
    buffet_category?: BuffetCategoryResource;
    created_at?: string;
    updated_at?: string;
};

export type BuffetItemFormData = {
    buffet_category_id: number | string;
    name: {
        ar: string;
        en: string;
    };
    description: {
        ar: string;
        en: string;
    };
    price: number | string;
    is_available?: boolean;
    is_vip?: boolean;
    is_active?: boolean;
    icon?: File | string | null;
};

export interface BuffetItemApiResponse {
    data: BuffetItemResource;
    message: string;
}

export interface BuffetItemsApiResponse {
    data: BuffetItemResource[];
    meta: PaginationMeta;
    message: string;
}

import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export async function getBuffetItems(
    params: Record<string, any> = {}
): Promise<ActionResponse<BuffetItemsApiResponse>> {
    try {
        const response = await api.get<BuffetItemsApiResponse>("/workspace/buffet-items", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getBuffetItem(
    id: string | number
): Promise<ActionResponse<BuffetItemApiResponse>> {
    try {
        const response = await api.get<BuffetItemApiResponse>(`/workspace/buffet-items/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createBuffetItem(
    formData: FormData | BuffetItemFormData | Record<string, any>
): Promise<ActionResponse<BuffetItemApiResponse>> {
    try {
        const response = await api.post<BuffetItemApiResponse>("/workspace/buffet-items", formData);
        revalidatePath("/workspace/buffet-items");
        revalidatePath("/workspace/buffet-categories");
        revalidatePath("/workspace/buffets");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateBuffetItem(
    id: string | number,
    formData: FormData | BuffetItemFormData | Record<string, any>
): Promise<ActionResponse<BuffetItemApiResponse>> {
    try {
        let response;
        if (formData instanceof FormData) {
            if (!formData.has("_method")) {
                formData.append("_method", "PUT");
            }
            response = await api.post<BuffetItemApiResponse>(`/workspace/buffet-items/${id}`, formData);
        } else {
            response = await api.put<BuffetItemApiResponse>(`/workspace/buffet-items/${id}`, formData);
        }

        revalidatePath("/workspace/buffet-items");
        revalidatePath("/workspace/buffet-categories");
        revalidatePath("/workspace/buffets");

        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteBuffetItem(
    ids: number[]
): Promise<ActionResponse<BuffetItemApiResponse>> {
    try {
        const response = await api.delete<BuffetItemApiResponse>("/workspace/buffet-items/delete", {
            data: { ids },
        });

        revalidatePath("/workspace/buffet-items");
        revalidatePath("/workspace/buffet-categories");
        revalidatePath("/workspace/buffets");

        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

"use server";

import api from "@/lib/api";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";
import { BuffetResource } from "./buffet.actions";

export type BuffetCategoryResource = {
    id: number;
    name_localized: string | null;
    name: Record<string, string>;
    buffet_id?: number | string;
    buffet?: BuffetResource;
};

export type BuffetCategoryFormData = {
    name: {
        ar: string;
        en: string;
    };
    buffet_id?: number | string;
};

export interface BuffetCategoryApiResponse {
    data: BuffetCategoryResource;
    message: string;
}

export interface BuffetCategoriesApiResponse {
    data: BuffetCategoryResource[];
    meta: PaginationMeta;
    message: string;
}

import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export async function getBuffetCategories(
    params: Record<string, any> = {}
): Promise<ActionResponse<BuffetCategoriesApiResponse>> {
    try {
        const response = await api.get<BuffetCategoriesApiResponse>("/workspace/buffet-categories", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getBuffetCategory(
    id: string | number
): Promise<ActionResponse<BuffetCategoryApiResponse>> {
    try {
        const response = await api.get<BuffetCategoryApiResponse>(`/workspace/buffet-categories/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createBuffetCategory(
    formData: BuffetCategoryFormData | Record<string, any>
): Promise<ActionResponse<BuffetCategoryApiResponse>> {
    try {
        const response = await api.post<BuffetCategoryApiResponse>("/workspace/buffet-categories", formData);
        revalidatePath("/workspace/buffet-categories");
        revalidatePath("/workspace/buffets");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateBuffetCategory(
    id: string | number,
    formData: BuffetCategoryFormData | Record<string, any>
): Promise<ActionResponse<BuffetCategoryApiResponse>> {
    try {
        const response = await api.put<BuffetCategoryApiResponse>(`/workspace/buffet-categories/${id}`, formData);
        revalidatePath("/workspace/buffet-categories");
        revalidatePath("/workspace/buffets");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteBuffetCategory(
    ids: number[]
): Promise<ActionResponse<BuffetCategoryApiResponse>> {
    try {
        const response = await api.delete<BuffetCategoryApiResponse>("/workspace/buffet-categories/delete", {
            data: { ids },
        });
        revalidatePath("/workspace/buffet-categories");
        revalidatePath("/workspace/buffets");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

"use server";

import api from "@/lib/api";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";
import { UserResource } from "../workspace/user.actions";
import { BranchResource } from "../company-spirit/branch.actions";
import { BuffetFormData } from "@/components/features/buffet/BuffetForm";


export type BuffetCategoryResource = {
    id: number;
    name_localized: string | null;
    name: Record<string, string>;
};

export type BuffetResource = {
    id: number;
    name_localized: string | null;
    name: Record<string, string>;
    branch_id: number | string;
    users?: UserResource[];
    branch?: BranchResource;
    buffet_categories?: BuffetCategoryResource[];
};



export interface BuffetApiResponse {
    data: BuffetResource;
    message: string;
}

export interface BuffetsApiResponse {
    data: BuffetResource[];
    meta: PaginationMeta;
    message: string;
}

import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export async function getBuffets(params: Record<string, any> = {}): Promise<ActionResponse<BuffetsApiResponse>> {
    try {
        const response = await api.get<BuffetsApiResponse>("/workspace/buffets", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getBuffet(id: string | number): Promise<ActionResponse<BuffetApiResponse>> {
    try {
        const response = await api.get<BuffetApiResponse>(`/workspace/buffets/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createBuffet(formData: BuffetFormData): Promise<ActionResponse<BuffetApiResponse>> {
    try {
        const response = await api.post<BuffetApiResponse>("/workspace/buffets", formData);
        revalidatePath("/workspace/buffets");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateBuffet(
    id: string | number,
    formData: BuffetFormData
): Promise<ActionResponse<BuffetApiResponse>> {
    try {
        const response = await api.put<BuffetApiResponse>(`/workspace/buffets/${id}`, formData);
        revalidatePath("/workspace/buffets");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteBuffet(ids: number[]): Promise<ActionResponse<BuffetApiResponse>> {
    try {
        const response = await api.delete<BuffetApiResponse>("/workspace/buffets/delete", { data: { ids } });
        revalidatePath("/workspace/buffets");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}
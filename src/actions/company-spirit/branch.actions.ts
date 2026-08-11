"use server";

import api from "@/lib/api";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";
import { UserResource } from "../workspace/user.actions";
import { DepartmentResource } from "./department.actions";
import { BranchFormData } from "@/components/features/company-spirit/BranchForm";

export type BranchResource = {
    id: number;
    name_localized: string | null;
    name: Record<string, string>;
    code: string | null;

    building_number: string | null;
    street: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
    full_address: string;

    manager_id: string | number | null;

    latitude: string | null;
    longitude: string | null;
    radius: string | null;

    manager?: UserResource | null;
    departments?: DepartmentResource[];
};

export interface BranchApiResponse {
    data: BranchResource;
    message: string;
}

export interface BranchesApiResponse {
    data: BranchResource[];
    meta: PaginationMeta;
    message: string;
}

import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export async function getBranches(query?: string, tenantId?: string): Promise<ActionResponse<BranchesApiResponse>> {
    try {
        const response = await api.get<BranchesApiResponse>(
            `/workspace/branches${query ? `?${query}` : ""}`,
            tenantId ? { headers: { "X-Tenant": tenantId } } : undefined,
        );
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getBranch(id: string | number): Promise<ActionResponse<BranchApiResponse>> {
    try {
        const response = await api.get<BranchApiResponse>(`/workspace/branches/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createBranch(formData: BranchFormData): Promise<ActionResponse<BranchApiResponse>> {
    try {
        const response = await api.post<BranchApiResponse>("/workspace/branches", formData);
        revalidatePath("/[locale]/company-spirit/organization-structure", "page");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateBranch(id: string | number, formData: BranchFormData): Promise<ActionResponse<BranchApiResponse>> {
    try {
        const response = await api.put<BranchApiResponse>(`/workspace/branches/${id}`, formData);
        revalidatePath("/[locale]/company-spirit/organization-structure", "page");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteBranch(ids: number[]): Promise<ActionResponse<BranchApiResponse>> {
    try {
        const response = await api.delete<BranchApiResponse>("/workspace/branches/delete", { data: { ids } });
        revalidatePath("/[locale]/company-spirit/organization-structure", "page");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}
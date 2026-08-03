"use server";

import api from "@/lib/api";
import { ApiResponse, PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";
import { UserResource } from "../workspace/user.actions";
import { BranchResource } from "./branch.actions";
import { DepartmentFormData } from "@/components/features/company-spirit/DepartmentForm";

export type DepartmentResource = {
    id: number;
    name_localized: string | null;
    name: Record<string, string>;
    branch_id: number | null;
    parent_id: number | null;
    manager_id: number | null;

    branch?: BranchResource | null;
    manager?: UserResource | null;
    parent?: DepartmentResource | null;
    users?: UserResource[];
    children?: DepartmentResource[];
};

export interface DepartmentApiResponse {
    data: DepartmentResource;
    message: string;
}

export interface DepartmentsApiResponse {
    data: DepartmentResource[];
    meta: PaginationMeta;
    message: string;
}

import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export async function getDepartments(query?: string): Promise<ActionResponse<DepartmentsApiResponse>> {
    try {
        const response = await api.get<DepartmentsApiResponse>(`/workspace/departments${query ? `?${query}` : ""}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getDepartment(id: string | number): Promise<ActionResponse<DepartmentApiResponse>> {
    try {
        const response = await api.get<DepartmentApiResponse>(`/workspace/departments/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createDepartment(formData: DepartmentFormData): Promise<ActionResponse<DepartmentApiResponse>> {
    try {
        const response = await api.post<DepartmentApiResponse>("/workspace/departments", formData);
        revalidatePath("/[locale]/company-spirit/organization-structure", "page");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateDepartment(id: string | number, formData: DepartmentFormData): Promise<ActionResponse<DepartmentApiResponse>> {
    try {
        const response = await api.put<DepartmentApiResponse>(`/workspace/departments/${id}`, formData);
        revalidatePath("/[locale]/company-spirit/organization-structure", "page");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteDepartment(ids: number[]): Promise<ActionResponse<DepartmentApiResponse>> {
    try {
        const response = await api.delete<DepartmentApiResponse>("/workspace/departments/delete", { data: { ids } });
        revalidatePath("/[locale]/company-spirit/organization-structure", "page");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}
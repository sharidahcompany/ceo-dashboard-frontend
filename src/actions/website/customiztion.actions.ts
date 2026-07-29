"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export interface SectionResource {
    id: number;
    order: number;
    type: string;
    type_localized?: string;
    content: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

export interface SectionApiResponse {
    data: SectionResource;
    message?: string;
}

export interface SectionsApiResponse {
    data: SectionResource[];
    message?: string;
}

export interface SectionDeleteApiResponse {
    message?: string;
}

export type SectionFormData = {
    order: number;
    type: string;
    content: Record<string, any>;
};

/**
 * Fetch all sections.
 */
export async function getSections(): Promise<ActionResponse<SectionsApiResponse>> {
    try {
        const response = await api.get<SectionsApiResponse>("/website/sections");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Fetch a single section by its ID.
 */
export async function getSection(id: string | number): Promise<ActionResponse<SectionApiResponse>> {
    try {
        const response = await api.get<SectionApiResponse>(`/website/sections/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Create a new section.
 */
export async function createSection(formData: SectionFormData): Promise<ActionResponse<SectionApiResponse>> {
    try {
        const response = await api.post<SectionApiResponse>("/website/sections", formData);
        revalidatePath("/website/customization");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Update an existing section by ID.
 */
export async function updateSection(id: string | number, formData: SectionFormData): Promise<ActionResponse<SectionApiResponse>> {
    try {
        const response = await api.put<SectionApiResponse>(`/website/sections/${id}`, formData);
        revalidatePath("/website/customization");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Delete one or more sections.
 */
export async function deleteSections(ids: number[]): Promise<ActionResponse<SectionDeleteApiResponse>> {
    try {
        const response = await api.delete<SectionDeleteApiResponse>("/website/sections", {
            data: { ids }
        });
        revalidatePath("/website/customization");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Reorder sections.
 */
export async function reorderSections(payload: { id: number; order: number }[]): Promise<ActionResponse<{ message?: string }>> {
    try {
        const response = await api.post<{ message?: string }>("/website/sections/reorder", { sections: payload });
        revalidatePath("/website/customization");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Upload media for sections.
 */
export async function uploadSectionMedia(formData: FormData): Promise<ActionResponse<{ success: boolean; id: number; url: string }>> {
    try {
        const response = await api.post<{ success: boolean; id: number; url: string }>("/website/media/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

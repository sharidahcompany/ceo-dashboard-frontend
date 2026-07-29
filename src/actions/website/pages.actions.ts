"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export interface PageResource {
    id: number;
    title: Record<string, string>;
    title_localized?: string | null;
    slug: string;
    description: Record<string, string>;
    keywords: Record<string, string>;
    is_published: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface PageApiResponse {
    data: PageResource;
    message?: string;
}

export interface PagesApiResponse {
    data: PageResource[];
    message?: string;
}

export type PageFormData = {
    title: Record<string, string>;
    slug: string;
    description: Record<string, string>;
    keywords: Record<string, string>;
    is_published: boolean | number;
};

/**
 * Fetch all pages.
 */
export async function getPages(): Promise<ActionResponse<PagesApiResponse>> {
    try {
        const response = await api.get<PagesApiResponse>("/website/pages");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Fetch a single page by its ID.
 */
export async function getPage(id: string | number): Promise<ActionResponse<PageApiResponse>> {
    try {
        const response = await api.get<PageApiResponse>(`/website/pages/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Create a new page.
 */
export async function createPage(formData: PageFormData): Promise<ActionResponse<PageApiResponse>> {
    try {
        const response = await api.post<PageApiResponse>("/website/pages", formData);
        revalidatePath("/website/pages");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Update an existing page by ID.
 */
export async function updatePage(id: string | number, formData: PageFormData): Promise<ActionResponse<PageApiResponse>> {
    try {
        const response = await api.put<PageApiResponse>(`/website/pages/${id}`, formData);
        revalidatePath("/website/pages");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Delete a page by ID.
 */
export async function deletePage(id: string | number): Promise<ActionResponse<{ message?: string }>> {
    try {
        const response = await api.delete<{ message?: string }>(`/website/pages/${id}`);
        revalidatePath("/website/pages");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

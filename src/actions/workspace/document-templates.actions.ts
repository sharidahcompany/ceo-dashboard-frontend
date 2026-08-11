"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

/** Backend serialises every enum as a {value,label} pair. */
export interface EnumField {
    value: string;
    label: string;
}

/**
 * A `{{placeholder}}` the backend parsed out of the template body. Keys follow
 * the body text and are never editable directly — only the presentation
 * metadata below is.
 */
export interface DocumentTemplateFieldResource {
    id: number;
    key: string;
    label: string;
    type: EnumField;
    options?: string[] | null;
    required: boolean;
    default_value?: string | null;
    sort_order: number;
}

/** A `[[SIGNATURE:role]]` / `[[STAMP:role]]` marker parsed out of the body. */
export interface DocumentTemplateAnchorResource {
    id: number;
    type: EnumField;
    role: string;
    party: EnumField;
    required: boolean;
    sort_order: number;
    token: string;
}

export interface DocumentTemplateResource {
    id: number;
    name: string;
    description?: string | null;
    category?: string | null;
    body_html?: string | null;
    header_html?: string | null;
    footer_html?: string | null;
    status: EnumField;
    page_size: string;
    orientation: string;
    version: number;
    created_by?: string | null;
    fields?: DocumentTemplateFieldResource[];
    anchors?: DocumentTemplateAnchorResource[];
    fields_count?: number;
    anchors_count?: number;
    created_at: string;
    updated_at: string;
}

export interface DocumentTemplateData {
    name?: string;
    description?: string | null;
    category?: string | null;
    body_html?: string | null;
    header_html?: string | null;
    footer_html?: string | null;
    status?: string;
    page_size?: string;
    orientation?: string;
}

/** Payload for the builder's side panel (labels, types, signer sides). */
export interface DocumentTemplateFieldsData {
    fields?: {
        key: string;
        label: string;
        type: string;
        required?: boolean;
        default_value?: string | null;
        options?: string[] | null;
    }[];
    anchors?: {
        type: string;
        role: string;
        party: string;
        required?: boolean;
    }[];
}

const LIST_PATH = "/[locale]/documents/templates";

export async function getDocumentTemplates(
    query?: string,
): Promise<ActionResponse<{ data: DocumentTemplateResource[]; meta?: any }>> {
    try {
        const params = new URLSearchParams(query);
        const response = await api.get(`/workspace/document-templates?${params.toString()}`);
        const responseData = response.data;
        return {
            success: true,
            data: {
                data: Array.isArray(responseData.data) ? responseData.data : [],
                meta: normalizePaginationMeta(responseData),
            },
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getDocumentTemplate(
    id: number | string,
): Promise<ActionResponse<DocumentTemplateResource>> {
    try {
        const response = await api.get(`/workspace/document-templates/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createDocumentTemplate(
    data: DocumentTemplateData,
): Promise<ActionResponse<DocumentTemplateResource>> {
    try {
        const response = await api.post("/workspace/document-templates", data);
        revalidatePath(LIST_PATH, "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateDocumentTemplate(
    id: number | string,
    data: DocumentTemplateData,
): Promise<ActionResponse<DocumentTemplateResource>> {
    try {
        const response = await api.put(`/workspace/document-templates/${id}`, data);
        revalidatePath(LIST_PATH, "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/** Saves the side panel: field labels/types/options and anchor signer sides. */
export async function updateDocumentTemplateFields(
    id: number | string,
    data: DocumentTemplateFieldsData,
): Promise<ActionResponse<DocumentTemplateResource>> {
    try {
        const response = await api.put(`/workspace/document-templates/${id}/fields`, data);
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteDocumentTemplates(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/document-templates", { data: { ids } });
        revalidatePath(LIST_PATH, "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Parses an unsaved body so the builder can show detected fields/anchors — and
 * surface malformed or split tokens — before anything is stored.
 */
export async function previewDocumentTemplate(
    bodyHtml: string,
): Promise<
    ActionResponse<{
        body_html: string;
        placeholders: string[];
        anchors: { type: string; role: string }[];
    }>
> {
    try {
        const response = await api.post("/workspace/document-templates/preview", {
            name: "preview",
            body_html: bodyHtml,
        });
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

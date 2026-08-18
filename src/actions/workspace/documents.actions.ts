"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";
import {
    DocumentTemplateResource,
    EnumField,
} from "@/actions/workspace/document-templates.actions";

export interface DocumentSignerResource {
    id: number;
    document_id: number;
    order: number;
    role: string;
    party: EnumField;
    user_id?: string | null;
    name: string;
    email?: string | null;
    phone?: string | null;
    status: EnumField;
    signature_kind?: EnumField;
    has_signature: boolean;
    signed_at?: string | null;
    decline_reason?: string | null;
    token_expires_at?: string | null;
}

export interface DocumentEventResource {
    id: number;
    event: string;
    actor_type: string;
    actor_id?: string | null;
    signer?: DocumentSignerResource | null;
    ip_address?: string | null;
    user_agent?: string | null;
    metadata?: Record<string, unknown> | null;
    created_at: string;
}

export interface DocumentResource {
    id: number;
    document_template_id?: number | null;
    title: string;
    public_code: string;
    template_version?: number | null;
    page_size: string;
    orientation: string;
    field_values?: Record<string, string> | null;
    status: EnumField;
    current_step: number;
    is_public_pdf: boolean;
    expires_at?: string | null;
    completed_at?: string | null;
    voided_at?: string | null;
    void_reason?: string | null;
    content_hash?: string | null;
    file_hash?: string | null;
    hash_algo?: string | null;
    has_pdf: boolean;
    created_by?: string | null;
    is_editable: boolean;
    is_pending: boolean;
    is_terminal: boolean;
    template?: DocumentTemplateResource | null;
    signers?: DocumentSignerResource[];
    events?: DocumentEventResource[];
    signers_count?: number;
    created_at: string;
    updated_at: string;
}

export interface DocumentSignerData {
    role: string;
    party: string;
    order?: number;
    name: string;
    user_id?: string | null;
    email?: string | null;
    phone?: string | null;
}

export interface DocumentData {
    document_template_id?: number;
    title?: string;
    field_values?: Record<string, string>;
    expires_at?: string | null;
    is_public_pdf?: boolean;
    signers?: DocumentSignerData[];
}

const LIST_PATH = "/[locale]/documents/issued";

export async function getDocuments(
    query?: string,
): Promise<ActionResponse<{ data: DocumentResource[]; meta?: any }>> {
    try {
        const params = new URLSearchParams(query);
        const response = await api.get(`/workspace/documents?${params.toString()}`);
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

export async function getDocument(
    id: number | string,
): Promise<ActionResponse<DocumentResource>> {
    try {
        const response = await api.get(`/workspace/documents/${id}?include=template,signers`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createDocument(
    data: DocumentData,
): Promise<ActionResponse<DocumentResource>> {
    try {
        const response = await api.post("/workspace/documents", data);
        revalidatePath(LIST_PATH, "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateDocument(
    id: number | string,
    data: DocumentData,
): Promise<ActionResponse<DocumentResource>> {
    try {
        const response = await api.put(`/workspace/documents/${id}`, data);
        revalidatePath(LIST_PATH, "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteDocuments(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/documents", { data: { ids } });
        revalidatePath(LIST_PATH, "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/** Rendered HTML of the document as it currently stands. */
export async function previewDocument(
    id: number | string,
): Promise<ActionResponse<{ html: string }>> {
    try {
        const response = await api.get(`/workspace/documents/${id}/preview`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function resendSignerInvite(
    documentId: number | string,
    signerId: number | string,
): Promise<ActionResponse<DocumentResource>> {
    try {
        const response = await api.post(`/workspace/documents/${documentId}/signers/${signerId}/resend`);
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function downloadDocumentPdf(
    id: number | string,
): Promise<ActionResponse<{ filename: string; content_type: string; base64: string }>> {
    try {
        const response = await api.get(`/workspace/documents/${id}/pdf`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getDocumentEvents(
    id: number | string,
): Promise<ActionResponse<DocumentEventResource[]>> {
    try {
        const response = await api.get(`/workspace/documents/${id}/events`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

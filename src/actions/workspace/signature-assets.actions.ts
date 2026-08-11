"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { EnumField } from "@/actions/workspace/document-templates.actions";

export interface SignatureAssetResource {
    id: number;
    name: string;
    type: EnumField;
    is_company: boolean;
    is_default: boolean;
    owner_user_id?: string | null;
    image_data_uri?: string | null;
    created_at: string;
}

export async function getSignatureAssets(
    query?: string,
): Promise<ActionResponse<{ data: SignatureAssetResource[]; meta?: any }>> {
    try {
        const params = new URLSearchParams(query);
        const response = await api.get(`/workspace/signature-assets?${params.toString()}`);
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

/** Saves a signature or (privileged) the company stamp from a canvas data URI. */
export async function createSignatureAssetFromDataUri(data: {
    name: string;
    type: "signature" | "stamp";
    image_data: string;
    is_company?: boolean;
    is_default?: boolean;
}): Promise<ActionResponse<SignatureAssetResource>> {
    try {
        const response = await api.post("/workspace/signature-assets", data);
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteSignatureAssets(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/signature-assets", { data: { ids } });
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/** Applies a signature/stamp to one signer's role on a document. */
export async function signDocument(
    documentId: number | string,
    payload: {
        role: string;
        signature_kind: "drawn" | "typed" | "uploaded" | "stamp";
        signature_data?: string;
        signature_asset_id?: number;
        typed_name?: string;
        typed_font?: string;
        save_as_asset?: boolean;
        asset_name?: string;
    },
): Promise<ActionResponse<any>> {
    try {
        const response = await api.post(`/workspace/documents/${documentId}/sign`, payload);
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function startDocument(
    documentId: number | string,
): Promise<ActionResponse<any>> {
    try {
        const response = await api.post(`/workspace/documents/${documentId}/start`);
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function voidDocument(
    documentId: number | string,
    reason?: string,
): Promise<ActionResponse<any>> {
    try {
        const response = await api.post(`/workspace/documents/${documentId}/void`, { reason });
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

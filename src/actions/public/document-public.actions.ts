"use server";

import publicApi from "@/lib/public-api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export interface PublicSigningSession {
    document: {
        title: string;
        html: string;
        status: string;
    };
    signer: {
        name: string;
        role: string;
        party: string;
        status: string;
        already_signed: boolean;
    };
}

export interface PublicVerificationSigner {
    name: string;
    role: string;
    party: string;
    status: string;
    email?: string | null;
    signed_at?: string | null;
}

export interface PublicVerification {
    title: string;
    public_code: string;
    status: { value: string; label: string };
    completed_at?: string | null;
    voided_at?: string | null;
    content_hash?: string | null;
    file_hash?: string | null;
    hash_algo?: string | null;
    has_pdf: boolean;
    pdf_downloadable: boolean;
    signers: PublicVerificationSigner[];
}

/**
 * Every action here returns the SAME generic error for anything gone wrong —
 * unknown code, unknown/expired token, already used — mirroring the backend's
 * deliberately-uninformative 404. A visitor should never be able to tell
 * "wrong code" apart from "expired" apart from "not yours".
 */

export async function getSigningSession(
    token: string,
): Promise<ActionResponse<PublicSigningSession>> {
    try {
        const response = await publicApi.get(`/public/documents/sign/${token}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("[getSigningSession] failed", {
            token,
            baseURL: publicApi.defaults.baseURL,
            message: (error as any)?.message,
            status: (error as any)?.response?.status,
            responseData: (error as any)?.response?.data,
        });
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function submitSignature(
    token: string,
    payload: {
        signature_kind: "drawn" | "typed" | "uploaded";
        signature_data: string;
        typed_name?: string;
        typed_font?: string;
    },
): Promise<ActionResponse<PublicSigningSession>> {
    try {
        const response = await publicApi.post(`/public/documents/sign/${token}`, payload);
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function declineSignature(
    token: string,
    reason?: string,
): Promise<ActionResponse<void>> {
    try {
        const response = await publicApi.post(`/public/documents/sign/${token}/decline`, { reason });
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function verifyDocument(code: string): Promise<ActionResponse<PublicVerification>> {
    try {
        const response = await publicApi.get(`/public/documents/verify/${code}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function verifyDocumentFile(
    code: string,
    formData: FormData,
): Promise<ActionResponse<{ matches: boolean }>> {
    try {
        const response = await publicApi.post(`/public/documents/verify/${code}/file`, formData);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/** Only meaningful when the sender opted in to a public PDF for this document. */
export async function downloadVerifiedPdf(
    code: string,
): Promise<ActionResponse<{ filename: string; content_type: string; base64: string }>> {
    try {
        const response = await publicApi.get(`/public/documents/verify/${code}/pdf`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

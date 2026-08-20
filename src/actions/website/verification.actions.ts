"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { PaginationMeta } from "@/types/common.types";
import { revalidatePath } from "next/cache";

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface VerificationTenantResource {
    id: string;
    name: string;
    logo_url?: string | null;
}

export interface VerificationRequestResource {
    id: string | number;
    tenant?: VerificationTenantResource;
    id_image_url: string | null;
    commercial_number: string;
    tax_number: string;
    status: VerificationStatus;
    rejection_reason?: string | null;
    created_at?: string;
    reviewed_at?: string | null;
}

export interface VerificationRequestsApiResponse {
    data: VerificationRequestResource[];
    meta?: PaginationMeta;
}

const VERIFICATION_PATH = "/[locale]/website/verification";
const VERIFICATION_REQUESTS_PATH = "/[locale]/website/verification-requests";

/**
 * Submit (or re-submit) the current tenant's verification documents.
 * Accepts a FormData so the ID image can be uploaded alongside the numbers.
 */
export async function submitVerificationRequest(
    formData: FormData,
): Promise<ActionResponse<VerificationRequestResource>> {
    try {
        const response = await api.post("/auth/tenants/verification", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        revalidatePath(VERIFICATION_PATH, "page");
        return {
            success: true,
            data: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * The current tenant's latest verification request, if any, so the upload
 * tab can show its status instead of a blank form.
 */
export async function getCurrentVerificationStatus(): Promise<
    ActionResponse<VerificationRequestResource | null>
> {
    try {
        const response = await api.get("/auth/tenants/verification");
        return { success: true, data: response.data.data ?? null };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Cross-tenant list of verification requests. Backed by a super-admin only
 * endpoint.
 */
export async function getVerificationRequests(
    query?: string,
): Promise<ActionResponse<{ data: VerificationRequestResource[]; meta?: PaginationMeta }>> {
    try {
        const response = await api.get<VerificationRequestsApiResponse>(
            `/auth/verification-requests${query ? `?${query}` : ""}`,
        );
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Approve a verification request. The backend sets `is_verified: true` on
 * the tenant as part of this call.
 */
export async function approveVerificationRequest(
    id: string | number,
): Promise<ActionResponse<void>> {
    try {
        await api.post(`/auth/verification-requests/${id}/approve`);
        revalidatePath(VERIFICATION_REQUESTS_PATH, "page");
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Reject a verification request, optionally with a reason shown back to the
 * tenant.
 */
export async function rejectVerificationRequest(
    id: string | number,
    reason?: string,
): Promise<ActionResponse<void>> {
    try {
        await api.post(`/auth/verification-requests/${id}/reject`, {
            reason,
        });
        revalidatePath(VERIFICATION_REQUESTS_PATH, "page");
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

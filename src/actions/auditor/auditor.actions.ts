"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export interface TenantResource {
    id: string;
    name: string;
    domain: string;
    email?: string;
    logo?: string;
    created_at?: string;
    updated_at?: string;
}

export interface AuditRequestResource {
    id: number;
    auditor_id: number;
    tenant_id: number;
    status: "pending" | "accepted" | "rejected";
    created_at?: string;
    updated_at?: string;
    from: string;
    to: string;
    from_name?: any;
    to_name?: any;
    applied_by: string;
    applied_by_id?: string;
    applier?: {
        id: string;
        first_name: string;
        last_name: string;
        username: string;
        email: string;
        phone?: string;
        avatar_url?: string;
    };
    tenant?: TenantResource;
    sender?: TenantResource;
    receiver?: TenantResource;
    auditor?: {
        id: number;
        name: string;
        email: string;
    };
}

/**
 * Fetch all tenants (companies)
 */
export async function getTenants(query: string = ""): Promise<ActionResponse<{ data: TenantResource[]; meta?: any }>> {
    try {
        const queryString = query ? (query.startsWith("?") ? query : `?${query}`) : "";
        const response = await api.get(`/auth/tenants${queryString}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Fetch incoming audit requests (requests from other companies to this auditor)
 */
export async function getIncomingRequests(query: string = ""): Promise<ActionResponse<{ data: AuditRequestResource[]; meta?: any }>> {
    try {
        const queryString = query ? (query.startsWith("?") ? query : `?${query}`) : "";
        const response = await api.get(`/auth/auditors/incoming-requests${queryString}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Fetch outgoing audit requests (requests sent by this auditor to companies)
 */
export async function getOutgoingRequests(query: string = ""): Promise<ActionResponse<{ data: AuditRequestResource[]; meta?: any }>> {
    try {
        const queryString = query ? (query.startsWith("?") ? query : `?${query}`) : "";
        const response = await api.get(`/auth/auditors/outgoing-requests${queryString}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Fetch subsidiaries (companies that have accepted this auditor)
 */
export async function getSubsidiaries(query: string = ""): Promise<ActionResponse<{ data: AuditRequestResource[]; meta?: any }>> {
    try {
        const queryString = query ? (query.startsWith("?") ? query : `?${query}`) : "";
        const response = await api.get(`/auth/auditors/subsidiaries${queryString}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Request access to a tenant/company by sending an invite or request
 */
export async function requestAccess(data: { to: string }): Promise<ActionResponse<AuditRequestResource>> {
    try {
        const response = await api.post("/auth/auditors/access-requests", data);
        revalidatePath("/[locale]/auditor/requests", "page");
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Accept an incoming audit request
 */
export async function acceptRequest(requestId: number | string): Promise<ActionResponse<void>> {
    try {
        await api.post(`/auth/auditors/requests/${requestId}/accept`);
        revalidatePath("/[locale]/auditor/requests", "page");
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Reject an incoming audit request
 */
export async function rejectRequest(requestId: number | string): Promise<ActionResponse<void>> {
    try {
        await api.post(`/auth/auditors/requests/${requestId}/reject`);
        revalidatePath("/[locale]/auditor/requests", "page");
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

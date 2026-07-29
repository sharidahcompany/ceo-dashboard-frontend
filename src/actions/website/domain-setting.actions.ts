"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export interface DomainResource {
    domain: string;
}

export interface DomainApiResponse {
    data: {
        domain: string;
    };
    message?: string;
}

export interface DomainStoreApiResponse {
    message: string;
}

/**
 * Fetch the domain associated with a tenant ID.
 */
export async function getDomain(tenantId: string | number): Promise<ActionResponse<DomainApiResponse>> {
    try {
        const response = await api.get<DomainApiResponse>(`/website/domains/${tenantId}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Create or replace the domain for the current tenant.
 */
export async function createDomain(data: { domain: string }): Promise<ActionResponse<DomainStoreApiResponse>> {
    try {
        const response = await api.post<DomainStoreApiResponse>("/website/domains", data);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

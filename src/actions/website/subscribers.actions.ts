"use server";

import api from "@/lib/api";
import { PaginationMeta } from "@/types/common.types";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export interface SubscriberOwnerResource {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
}

export interface SubscriberResource {
    id: string;
    name: Record<string, string> | string;
    name_localized: string | null;
    logo_url: string | null;
    email: string | null;
    phone: string | null;
    created_at: string | null;
    owner: SubscriberOwnerResource | null;
}

export interface SubscribersApiResponse {
    data: SubscriberResource[];
    meta?: PaginationMeta;
}

/**
 * Subscribed tenants together with their owner. Backed by a super-admin only
 * endpoint — the public /auth/subscribers list carries logos only.
 */
export async function getSubscribers(
    query?: string,
): Promise<ActionResponse<{ data: SubscriberResource[]; meta?: PaginationMeta }>> {
    try {
        const response = await api.get<SubscribersApiResponse>(
            `/auth/subscribers/details${query ? `?${query}` : ""}`,
        );
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

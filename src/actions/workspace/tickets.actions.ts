"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { UserResource } from "@/actions/projects/projects.actions";
import { revalidatePath } from "next/cache";

export type TicketStatus = "open" | "in_progress" | "solved";

export interface TicketReplyResource {
    id: number;
    ticket_id: number;
    message: string;
    user?: UserResource;
    created_at?: string;
    updated_at?: string;
}

export interface TicketResource {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    subject: string;
    message: string;
    status: { value: TicketStatus; label: string };
    visitor_id?: string | null;
    assignee_id?: string | null;
    assignee?: UserResource;
    project_id?: number | null;
    task_id?: number | null;
    replies_count?: number;
    replies?: TicketReplyResource[];
    solved_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface TicketStats {
    all: number;
    open: number;
    in_progress: number;
    solved: number;
}

export interface TicketsApiResponse {
    stats: TicketStats;
    data: TicketResource[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface TicketApiResponse {
    data: TicketResource;
    message?: string;
}

export interface TicketListParams {
    status?: TicketStatus;
    search?: string;
    page?: number;
    per_page?: number;
}

const TICKETS_PATH = "/[locale]/tickets";

/**
 * Fetch the ticket list, optionally narrowed to one status or a search term.
 */
export async function getTickets(
    params: TicketListParams = {}
): Promise<ActionResponse<TicketsApiResponse>> {
    try {
        const query: Record<string, string | number> = {};

        if (params.status) query["filter[status]"] = params.status;
        if (params.search) query["filter[search]"] = params.search;
        if (params.page) query["page"] = params.page;
        query["per_page"] = params.per_page ?? 50;

        const response = await api.get<TicketsApiResponse>("/workspace/tickets", {
            params: query,
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Fetch a single ticket with its full reply thread.
 */
export async function getTicket(
    id: string | number
): Promise<ActionResponse<TicketApiResponse>> {
    try {
        const response = await api.get<TicketApiResponse>(`/workspace/tickets/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Reply to a visitor. The backend also marks the ticket solved and completes
 * the task mirroring it, so the returned ticket is the source of truth.
 */
export async function replyToTicket(
    id: string | number,
    message: string
): Promise<ActionResponse<TicketApiResponse>> {
    try {
        const response = await api.post<TicketApiResponse>(
            `/workspace/tickets/${id}/replies`,
            { message }
        );
        revalidatePath(TICKETS_PATH, "page");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Change a ticket's status.
 */
export async function updateTicketStatus(
    id: string | number,
    status: TicketStatus
): Promise<ActionResponse<TicketApiResponse>> {
    try {
        const response = await api.patch<TicketApiResponse>(
            `/workspace/tickets/${id}/status`,
            { status }
        );
        revalidatePath(TICKETS_PATH, "page");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Delete one or more tickets.
 */
export async function deleteTickets(
    ids: number[]
): Promise<ActionResponse<{ message?: string }>> {
    try {
        const response = await api.delete<{ message?: string }>("/workspace/tickets", {
            data: { ids },
        });
        revalidatePath(TICKETS_PATH, "page");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

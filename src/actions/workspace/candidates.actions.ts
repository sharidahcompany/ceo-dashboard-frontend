"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export interface JobApplicationResource {
    id: number;
    vacancy_id: number;
    vacancy?: {
        id: number;
        title: string;
    } | null;
    full_name: string;
    email: string;
    phone?: string | null;
    cv?: string | null;
    cover_letter?: string | null;
    status: string;
    status_label?: string;
    created_at: string;
    updated_at: string;
}

export interface JobApplicationData {
    vacancy_id: string;
    full_name: string;
    email: string;
    phone?: string;
    cv?: string;
    cover_letter?: string;
    status?: string;
}

export async function getCandidates(query?: string): Promise<ActionResponse<{ data: JobApplicationResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/workspace/job-applications${query ? `?${query}` : ""}`);
        const responseData = response.data;
        return {
            success: true,
            data: {
                data: Array.isArray(responseData.data) ? responseData.data : [],
                meta: normalizePaginationMeta(responseData)
            }
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getCandidate(id: number | string): Promise<ActionResponse<JobApplicationResource>> {
    try {
        const response = await api.get(`/workspace/job-applications/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createCandidate(data: JobApplicationData): Promise<ActionResponse<JobApplicationResource>> {
    try {
        const response = await api.post("/workspace/job-applications", data);
        revalidatePath("/[locale]/hr/candidates", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateCandidate(id: number | string, data: JobApplicationData): Promise<ActionResponse<JobApplicationResource>> {
    try {
        const response = await api.put(`/workspace/job-applications/${id}`, data);
        revalidatePath("/[locale]/hr/candidates", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteCandidates(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/job-applications", { data: { ids } });
        revalidatePath("/[locale]/hr/candidates", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function acceptCandidate(id: number | string): Promise<ActionResponse<JobApplicationResource>> {
    try {
        // "accept/{id}" only moves the application to `waiting` (a
        // pending-confirmation step); "confirme/{id}" is what actually sets
        // status to `accepted`, which is what the candidates UI shows.
        const response = await api.put(`/workspace/job-applications/confirme/${id}`);
        revalidatePath("/[locale]/hr/candidates", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function rejectCandidate(id: number | string): Promise<ActionResponse<JobApplicationResource>> {
    try {
        const response = await api.put(`/workspace/job-applications/reject/${id}`);
        revalidatePath("/[locale]/hr/candidates", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateCandidateStatus(id: number | string, status: string): Promise<ActionResponse<JobApplicationResource>> {
    if (status === "accepted") return acceptCandidate(id);
    if (status === "rejected") return rejectCandidate(id);
    return updateCandidate(id, { status } as JobApplicationData);
}

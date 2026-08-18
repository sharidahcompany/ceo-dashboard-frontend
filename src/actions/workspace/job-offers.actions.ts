"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";
import { PositionResource } from "./positions.actions";

export interface JobOfferResource {
    id: number;
    salary: string;
    start_date: string | null;
    benefits: string | null;
    document_id: number | null;
    status: { value: string; label: string };
    user?: { id: string; first_name?: string; last_name?: string; full_name?: string; email?: string };
    position?: PositionResource;
    job_application?: { id: number };
    document?: { id: number; public_code: string; status: { value: string; label: string } };
    created_at: string;
    updated_at: string;
}

export interface JobOfferData {
    job_application_id?: number | string | null;
    position_id: string;
    user_id: string;
    salary: string;
    start_date?: string;
    benefits?: string;
}

export async function getJobOffers(query?: string): Promise<ActionResponse<{ data: JobOfferResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/workspace/job-offers${query ? `?${query}` : ""}`);
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

export async function getJobOffer(id: number | string): Promise<ActionResponse<JobOfferResource>> {
    try {
        const response = await api.get(`/workspace/job-offers/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createJobOffer(data: JobOfferData): Promise<ActionResponse<JobOfferResource>> {
    try {
        const response = await api.post("/workspace/job-offers", data);
        revalidatePath("/[locale]/hr/job-offers", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateJobOffer(id: number | string, data: JobOfferData): Promise<ActionResponse<JobOfferResource>> {
    try {
        const response = await api.put(`/workspace/job-offers/${id}`, data);
        revalidatePath("/[locale]/hr/job-offers", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function generateJobOfferDocument(id: number | string): Promise<ActionResponse<JobOfferResource>> {
    try {
        const response = await api.post(`/workspace/job-offers/${id}/generate`);
        revalidatePath("/[locale]/hr/job-offers", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function sendJobOffer(id: number | string): Promise<ActionResponse<JobOfferResource>> {
    try {
        const response = await api.post(`/workspace/job-offers/${id}/send`);
        revalidatePath("/[locale]/hr/job-offers", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function resendJobOffer(id: number | string): Promise<ActionResponse<JobOfferResource>> {
    try {
        const response = await api.post(`/workspace/job-offers/${id}/resend`);
        revalidatePath("/[locale]/hr/job-offers", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteJobOffers(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/job-offers", { data: { ids } });
        revalidatePath("/[locale]/hr/job-offers", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

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
    user_id?: string;
    // Derived from the applicant's own account (job_applications has no
    // full_name/email/phone/cover_letter columns of its own) — read-only,
    // present only when the backend eager-loads `user`.
    full_name?: string;
    email?: string;
    phone?: string | null;
    cv?: string | null;
    recommended_by?: number | null;
    status: string;
    status_label?: string;
    // Profile-style data captured on the application itself, ahead of the
    // candidate having a Profile row (Profile is only created on
    // conversion). Copied straight through to the employee's Profile then.
    id_number?: string | null;
    address?: string | null;
    nationality?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    marital_status?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    created_at: string;
    updated_at: string;
}

export interface JobApplicationData {
    vacancy_id: string;
    // Who the application is actually for. Required for an HR-entered
    // referral (Auth::user() there is the HR staffer, not the candidate);
    // omitted entirely by the public apply flow, which always applies as
    // the authenticated candidate.
    user_id?: string;
    recommended_by?: string;
    status?: string;
    file?: File;
    id_number?: string;
    address?: string;
    nationality?: string;
    date_of_birth?: string;
    gender?: string;
    marital_status?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
}

export interface ExperienceEntry {
    id?: number;
    title: string;
    organization: string;
    description?: string;
    start_date: string;
    end_date?: string;
    type: "work" | "education";
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

function toFormData(data: JobApplicationData): FormData {
    const formData = new FormData();
    if (data.vacancy_id) formData.append("vacancy_id", data.vacancy_id);
    if (data.user_id) formData.append("user_id", data.user_id);
    if (data.recommended_by) formData.append("recommended_by", data.recommended_by);
    if (data.status) formData.append("status", data.status);
    if (data.file) formData.append("file", data.file);
    if (data.id_number) formData.append("id_number", data.id_number);
    if (data.address) formData.append("address", data.address);
    if (data.nationality) formData.append("nationality", data.nationality);
    if (data.date_of_birth) formData.append("date_of_birth", data.date_of_birth);
    if (data.gender) formData.append("gender", data.gender);
    if (data.marital_status) formData.append("marital_status", data.marital_status);
    if (data.emergency_contact_name) formData.append("emergency_contact_name", data.emergency_contact_name);
    if (data.emergency_contact_phone) formData.append("emergency_contact_phone", data.emergency_contact_phone);
    return formData;
}

export async function createCandidate(data: JobApplicationData): Promise<ActionResponse<JobApplicationResource>> {
    try {
        const response = await api.post("/workspace/job-applications", toFormData(data));
        revalidatePath("/[locale]/hr/candidates", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateCandidate(id: number | string, data: JobApplicationData): Promise<ActionResponse<JobApplicationResource>> {
    try {
        // PUT is spoofed via _method since multipart requests can't use a real PUT verb.
        const formData = toFormData(data);
        formData.append("_method", "PUT");
        const response = await api.post(`/workspace/job-applications/${id}`, formData);
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

// Batch-syncs a candidate's work/education history. Backend replaces the
// existing rows for the submitted `type`s with this list (upsert-by-id, then
// deletes anything not resubmitted) — always pass the full current list, not
// a delta.
export async function syncExperiences(
    userId: string,
    experiences: ExperienceEntry[]
): Promise<ActionResponse<void>> {
    try {
        const response = await api.post("/workspace/experiences", {
            user_id: userId,
            experiences,
        });
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

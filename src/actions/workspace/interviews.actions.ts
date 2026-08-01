"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";
import { UserResource } from "./user.actions";

export interface JobInterviewResource {
    id: number;
    parent_id?: number | null;
    user?: {
        id: string;
        full_name: string;
        avatar: string | null;
        first_name?: string;
        last_name?: string;
    } | null;
    user_id: string;
    interviewers?: Array<{
        id: string;
        full_name: string;
        avatar: string | null;
    }>;
    scheduled_at: string;
    meeting_link?: string | null;
    location?: string | null;
    reschedule_reason?: string | null;
    hr_notes?: string | null;
    interview_type: "online" | "on_site";
    interview_type_label: string;
    status: string;
    status_label: string;
    created_at: string;
    updated_at: string;
}

export interface InterviewData {
    user_id: string;
    interviewers_id: string[];
    scheduled_at: string;
    interview_type: "online" | "on_site";
    meeting_link?: string;
    location?: string;
    status?: string;
    hr_notes?: string;
}

export async function getInterviews(query?: string): Promise<ActionResponse<{ data: JobInterviewResource[]; meta?: any }>> {
    try {
        const response = await api.get(`/workspace/job-interviews${query ? `?${query}` : ""}`);
        const responseData = response.data;
        return {
            success: true,
            data: {
                data: Array.isArray(responseData.data) ? responseData.data : [],
                meta: responseData.meta
            }
        };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getInterview(id: number | string): Promise<ActionResponse<JobInterviewResource>> {
    try {
        const response = await api.get(`/workspace/job-interviews/${id}`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createInterview(data: InterviewData): Promise<ActionResponse<JobInterviewResource>> {
    try {
        const response = await api.post("/workspace/job-interviews", data);
        revalidatePath("/[locale]/hr/interviews", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateInterview(id: number | string, data: InterviewData): Promise<ActionResponse<JobInterviewResource>> {
    try {
        const response = await api.put(`/workspace/job-interviews/${id}`, data);
        revalidatePath("/[locale]/hr/interviews", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteInterviews(ids: number[]): Promise<ActionResponse<void>> {
    try {
        const response = await api.delete("/workspace/job-interviews", { data: { ids } });
        revalidatePath("/[locale]/hr/interviews", "page");
        return { success: true, data: undefined as any, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

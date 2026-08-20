"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";
import { UserResource } from "@/actions/workspace/user.actions";

export interface ConversionPreview {
    user: {
        id: string;
        username: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    department_id: number | null;
    position_id: number | null;
    hire_date: string | null;
    gross_salary: string | null;
    full_name?: string | null;
    id_number?: string | null;
    address?: string | null;
    nationality?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    marital_status?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    interviews: Array<{
        id: number;
        scheduled_at: string | null;
        status: string | null;
        feedback: Array<{
            interviewer: string;
            recommendation: string | null;
            rating: number | null;
            notes: string | null;
        }>;
    }>;
}

export interface ConvertToEmployeeData {
    department_id: string;
    position_id: string;
    hire_date?: string;
    gross_salary?: string;
    id_number?: string;
    full_name?: string;
    address?: string;
    nationality?: string;
    date_of_birth?: string;
    gender?: string;
    marital_status?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    custom_fields?: Record<string, string>;
}

export async function getConversionPreview(applicationId: number | string): Promise<ActionResponse<ConversionPreview>> {
    try {
        const response = await api.get(`/workspace/job-applications/${applicationId}/conversion-preview`);
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function convertToEmployee(
    applicationId: number | string,
    data: ConvertToEmployeeData
): Promise<ActionResponse<UserResource>> {
    try {
        const response = await api.post(`/workspace/job-applications/${applicationId}/convert-to-employee`, data);
        revalidatePath("/[locale]/hr/candidates", "page");
        return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

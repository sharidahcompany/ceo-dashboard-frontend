"use server";

import { WebsiteSettingFormData } from "@/components/features/website/SettingForm";
import api from "@/lib/api";

export interface WebsiteSettingResource {

    title?: Record<string, string | null> | null;
    description?: Record<string, string | null> | null;

    keywords?: string[] | null;

    phone?: string | null;
    email?: string | null;

    primary_color?: string | null;
    dark_mode_color?: string | null;

    enable_dark_mode: boolean;
    enable_localization: boolean;
    maintenance_mode: boolean;

    appstore_link?: string | null;
    playstore_link?: string | null;

    logo_url?: string | null;
    favicon_url?: string | null;
}

export interface WebsiteSettingApiResponse {
    data: WebsiteSettingResource;
    message: string;
}

import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export async function showSettings(): Promise<ActionResponse<WebsiteSettingApiResponse>> {
    try {
        const response = await api.get<WebsiteSettingApiResponse>(`/website/settings/1`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function storeSettings(data: FormData | WebsiteSettingFormData): Promise<ActionResponse<WebsiteSettingApiResponse>> {
    try {
        const response = await api.post<WebsiteSettingApiResponse>(`/website/settings`, data);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

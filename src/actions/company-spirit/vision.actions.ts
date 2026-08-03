"use server";

import api from "@/lib/api";
import { ApiResponse } from "@/types/common.types";
import { revalidatePath } from "next/cache";

export type VisionResource = {
  id: string | number;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  title_localized: string;
  description_localized: string;
  media_url?: string;
};

import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export async function getVision(): Promise<ActionResponse<ApiResponse<VisionResource>>> {
  try {
    const res = await api.get<ApiResponse<VisionResource>>("/workspace/visions");
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function createVision(formData: FormData): Promise<ActionResponse<ApiResponse<VisionResource>>> {
  try {
    const res = await api.post<ApiResponse<VisionResource>>("/workspace/visions", formData);
    revalidatePath('/[locale]/company-spirit/vision', 'page');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateVision(id: string | number, formData: FormData): Promise<ActionResponse<ApiResponse<VisionResource>>> {
  try {
    if (!formData.has("_method")) {
      formData.append("_method", "PUT");
    }
    const res = await api.post<ApiResponse<VisionResource>>(`/workspace/visions/${id}`, formData);
    revalidatePath('/[locale]/company-spirit/vision', 'page');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
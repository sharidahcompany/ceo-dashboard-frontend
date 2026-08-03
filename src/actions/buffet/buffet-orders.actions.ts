"use server";

import api from "@/lib/api";
import { PaginationMeta } from "@/types/common.types";
import { UserResource } from "@/actions/workspace/user.actions";
import { revalidatePath } from "next/cache";
import { BuffetItemResource } from "./buffet-item.actions";

export type BuffetOrderItemResource = {
  id: number;
  buffet_order_id: number | string;
  buffet_item_id: number | string;
  quantity: number;
  notes?: string | null;
  buffet_item?: BuffetItemResource;
  created_at?: string;
  updated_at?: string;
};

export type BuffetOrderResource = {
  id: number;
  user_id: number | string;
  user?: UserResource;
  notes?: string | null;
  status: "pending" | "processing" | "rejected" | "completed" | "cancelled";
  items?: BuffetOrderItemResource[];
  created_at?: string;
  updated_at?: string;
};

export type BuffetOrderItemFormData = {
  buffet_item_id: number | string;
  quantity: number;
  notes?: string | null;
};

export type BuffetOrderFormData = {
  notes?: string | null;
  items: BuffetOrderItemFormData[];
  status?: "pending" | "processing" | "rejected" | "completed" | "cancelled";
};

export interface BuffetOrderApiResponse {
  data: BuffetOrderResource;
  message: string;
}

export interface BuffetOrdersApiResponse {
  data: BuffetOrderResource[];
  meta: PaginationMeta;
  message: string;
}

import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export async function getBuffetOrders(
  params: Record<string, any> = {},
): Promise<ActionResponse<BuffetOrdersApiResponse>> {
  try {
    const response = await api.get<BuffetOrdersApiResponse>("/workspace/buffet-orders", { params });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getBuffetOrder(
  id: string | number,
): Promise<ActionResponse<BuffetOrderApiResponse>> {
  try {
    const response = await api.get<BuffetOrderApiResponse>(`/workspace/buffet-orders/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function createBuffetOrder(
  formData: BuffetOrderFormData | Record<string, any>,
): Promise<ActionResponse<BuffetOrderApiResponse>> {
  try {
    const response = await api.post<BuffetOrderApiResponse>("/workspace/buffet-orders", formData);
    revalidatePath("/[locale]/buffets", "layout");
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateBuffetOrder(
  id: string | number,
  formData: Partial<BuffetOrderFormData> | Record<string, any>,
): Promise<ActionResponse<BuffetOrderApiResponse>> {
  try {
    const response = await api.put<BuffetOrderApiResponse>(`/workspace/buffet-orders/${id}`, formData);
    revalidatePath("/[locale]/buffets", "layout");
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteBuffetOrder(
  ids: number[],
): Promise<ActionResponse<BuffetOrderApiResponse>> {
  try {
    const response = await api.delete<BuffetOrderApiResponse>("/workspace/buffet-orders/delete", {
      data: { ids },
    });
    revalidatePath("/[locale]/buffets", "layout");
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
export async function updateBuffetOrderStatus(
  id: string | number,
  status: "pending" | "processing" | "rejected" | "completed" | "cancelled",
): Promise<ActionResponse<BuffetOrderApiResponse>> {
  try {
    const response = await api.put<BuffetOrderApiResponse>(`/workspace/buffet-orders/${id}/status`, {
      status,
    });
    revalidatePath("/[locale]/buffets", "layout");
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

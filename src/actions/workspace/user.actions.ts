"use server";

import api from "@/lib/api";
import { PaginationMeta } from "@/types/common.types";

export interface UserResource {
  id: string;
  username?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string;
  email: string;
  avatar: string | null;
  // central-auth only
  password?: string | null;
  permissions?: string[];
  roles?: string[];
  tenants?: Record<string, any>[];
}

export interface UserApiResponse {
  data: UserResource;
  message: string;
}

export interface UsersApiResponse {
  data: UserResource[];
  meta: PaginationMeta;
  message: string;
}

import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export async function getUsers(params: Record<string, any> = {}): Promise<ActionResponse<UsersApiResponse>> {
  try {
    const response = await api.get<UsersApiResponse>(`/auth/users`, { params });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Fetch users that belong to the current tenant (workspace database).
 * Calls GET /workspace/users which is served by the workspace-service.
 */
export async function getTenantUsers(params: Record<string, any> = {}): Promise<ActionResponse<UsersApiResponse>> {
  try {
    const response = await api.get<UsersApiResponse>(`/workspace/users`, { params });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getAuthenticatedUser(): Promise<ActionResponse<UserResource>> {
  try {
    const response = await api.get<UserApiResponse>("/auth/me");
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function logout(): Promise<ActionResponse<void>> {
  try {
    await api.get("/auth/logout");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
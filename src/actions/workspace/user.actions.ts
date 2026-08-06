"use server";

import api from "@/lib/api";
import { PaginationMeta } from "@/types/common.types";
import type { BranchResource } from "@/actions/company-spirit/branch.actions";
import type { DepartmentResource } from "@/actions/company-spirit/department.actions";
import type { PositionResource } from "./positions.actions";

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
  // present when the request is scoped to a tenant (X-Tenant header): this
  // user's role within that specific tenant (employee, owner, super-admin)
  tenant_role?: string | null;
  // workspace-scoped: a user can belong to more than one branch/department
  // and hold more than one position at the same time
  branches?: BranchResource[];
  departments?: DepartmentResource[];
  positions?: PositionResource[];
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

import { getErrorMessage, getRowErrors, extractFileDownload, FileDownload } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export async function getUsers(query?: string): Promise<ActionResponse<UsersApiResponse>> {
  try {
    const response = await api.get<UsersApiResponse>(`/auth/users${query ? `?${query}` : ""}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Fetch central-auth users belonging to the current tenant (scoped
 * server-side via the X-Tenant header already attached to every request),
 * restricted to the roles that make up an organization's staff within that
 * tenant (employee, owner, super-admin). Used by the HR "Employees" list.
 */
export async function getEmployees(query?: string): Promise<ActionResponse<UsersApiResponse>> {
  const roleFilter = "roles=employee,owner,super-admin";
  return getUsers(query ? `${query}&${roleFilter}` : roleFilter);
}

/**
 * Bulk-invite employees from an uploaded spreadsheet. The backend validates
 * every row before creating/inviting anyone — on failure nothing is saved
 * and the first row error is returned; on success each new row goes through
 * the same create-or-invite path as inviteUser(), so imported employees get
 * their invitation email too.
 */
export async function importEmployees(file: File): Promise<ActionResponse<void>> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/auth/users/import", formData);
    return { success: true, data: undefined as any, message: response.data.message };
  } catch (error) {
    return { success: false, error: getErrorMessage(error), errors: getRowErrors(error) };
  }
}

export async function exportEmployees(): Promise<ActionResponse<FileDownload>> {
  try {
    const response = await api.get("/auth/users/export", { responseType: "arraybuffer" });
    return { success: true, data: extractFileDownload(response, "employees.xlsx") };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function downloadEmployeeImportTemplate(): Promise<ActionResponse<FileDownload>> {
  try {
    const response = await api.get("/auth/users/import-template", { responseType: "arraybuffer" });
    return { success: true, data: extractFileDownload(response, "employee-import-template.xlsx") };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export interface InviteUserData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
}

/**
 * Invite a new user to join the current tenant (X-Tenant header). The
 * backend creates a central-auth account, attaches it to the tenant with
 * the "employee" role, and emails an invitation/setup link — the user sets
 * their own password via that link, so none is sent here.
 */
export async function inviteUser(data: InviteUserData): Promise<ActionResponse<UserResource>> {
  try {
    const response = await api.post("/auth/users", data);
    return {
      success: true,
      data: response.data.data ?? response.data,
      message: response.data.message,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getEmployee(id: string): Promise<ActionResponse<UserResource>> {
  try {
    const response = await api.get(`/auth/users/${id}`);
    return { success: true, data: response.data.data ?? response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export interface UpdateEmployeeData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
}

export async function updateEmployee(
  id: string,
  data: UpdateEmployeeData,
): Promise<ActionResponse<UserResource>> {
  try {
    const response = await api.put(`/auth/users/${id}`, data);
    return {
      success: true,
      data: response.data.data ?? response.data,
      message: response.data.message,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Fetch users that belong to the current tenant (workspace database).
 * Calls GET /workspace/users which is served by the workspace-service.
 */
export async function getTenantUsers(query?: string): Promise<ActionResponse<UsersApiResponse>> {
  try {
    const response = await api.get<UsersApiResponse>(`/workspace/users${query ? `?${query}` : ""}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Fetch a single tenant-scoped user (GET /workspace/users/{id}), including
 * the workspace relations (branches, departments, positions) that the
 * central-auth /auth/users/{id} resource doesn't carry.
 */
export async function getTenantUser(id: string | number): Promise<ActionResponse<UserResource>> {
  try {
    const response = await api.get(`/workspace/users/${id}`);
    return { success: true, data: response.data.data ?? response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export interface AssignUserBranchesData {
  branch_ids: (number | string)[];
}

export async function assignUserBranches(
  id: string | number,
  data: AssignUserBranchesData,
): Promise<ActionResponse<UserResource>> {
  try {
    const response = await api.put(`/workspace/users/${id}/branches`, data);
    return { success: true, data: response.data.data ?? response.data, message: response.data.message };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export interface AssignUserDepartmentsData {
  department_ids: (number | string)[];
}

export async function assignUserDepartments(
  id: string | number,
  data: AssignUserDepartmentsData,
): Promise<ActionResponse<UserResource>> {
  try {
    const response = await api.put(`/workspace/users/${id}/departments`, data);
    return { success: true, data: response.data.data ?? response.data, message: response.data.message };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export interface AssignUserPositionsData {
  position_ids: (number | string)[];
}

export async function assignUserPositions(
  id: string | number,
  data: AssignUserPositionsData,
): Promise<ActionResponse<UserResource>> {
  try {
    const response = await api.put(`/workspace/users/${id}/positions`, data);
    return { success: true, data: response.data.data ?? response.data, message: response.data.message };
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

export interface UpdateProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  username?: string;
  avatar?: File | null;
}

/**
 * Accepts a FormData so an avatar file can be uploaded alongside the other
 * profile fields. /auth/me only supports GET, so the update goes through the
 * user resource route for the authenticated user's own id. PUT is spoofed
 * via _method since multipart requests can't use a real PUT verb.
 */
export async function updateProfile(
  id: string,
  formData: FormData,
): Promise<ActionResponse<UserResource>> {
  try {
    formData.append("_method", "PUT");
    const response = await api.post<UserApiResponse>(`/auth/users/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export interface ChangePasswordFormData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export async function changePassword(
  data: ChangePasswordFormData,
): Promise<ActionResponse<void>> {
  try {
    const response = await api.post("/auth/change-password", data);
    return { success: true, data: undefined, message: response.data?.message };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
"use server";

import { randomBytes } from "crypto";
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

  // GET/PUT /workspace/users/{id} additionally return these — the Profile
  // fields, flattened onto the user, plus the single department/position a
  // User row is directly assigned to (distinct from the plural
  // departments/positions pivots above, which EmployeeAssignmentsForm owns).
  id_number?: string | null;
  address?: string | null;
  nationality?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  hire_date?: string | null;
  employment_type?: string | null;
  gross_salary?: string | null;
  net_salary?: string | null;
  housing_allowance?: string | null;
  transportation_allowance?: string | null;
  other_allowances?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  custom_fields?: Record<string, string> | null;
  department?: { id: number; name: Record<string, string> | string } | null;
  position?: { id: number; name: Record<string, string> | string } | null;
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

/**
 * Fetch users belonging to the current tenant, served by workspace-service
 * (not central-auth) so results are scoped to the workspace database.
 */
export async function getUsers(query?: string): Promise<ActionResponse<UsersApiResponse>> {
  try {
    const response = await api.get<UsersApiResponse>(`/workspace/users${query ? `?${query}` : ""}`);
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
/**
 * Deletes each id's employee_deleted Kafka event fires for finance-service/
 * website-service to clean up their own records and for auth-service to
 * detach the tenant membership; nothing further is needed here.
 */
export async function deleteEmployees(ids: (string | number)[]): Promise<ActionResponse<void>> {
  try {
    const response = await api.delete("/workspace/users", { data: { ids } });
    return { success: true, data: undefined as any, message: response.data?.message };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function importEmployees(file: File): Promise<ActionResponse<void>> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/workspace/users/import", formData);
    return { success: true, data: undefined as any, message: response.data.message };
  } catch (error) {
    return { success: false, error: getErrorMessage(error), errors: getRowErrors(error) };
  }
}

export async function exportEmployees(): Promise<ActionResponse<FileDownload>> {
  try {
    const response = await api.get("/workspace/users/export", { responseType: "arraybuffer" });
    return { success: true, data: extractFileDownload(response, "employees.xlsx") };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function downloadEmployeeImportTemplate(): Promise<ActionResponse<FileDownload>> {
  try {
    const response = await api.get("/workspace/users/import-template", { responseType: "arraybuffer" });
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
  // Recipient email per external anchor on the default contract template
  // (e.g. an outside witness/counter-signer), keyed by anchor role — see
  // ContractGenerationService::seedSigners() on the backend.
  signers?: { role: string; email: string }[];
}

/**
 * Invite a new employee into the current tenant (X-Tenant header). Goes
 * through workspace-service (POST /workspace/users -> EmployeeService::create),
 * which stores the User + Profile in one request and publishes a single
 * `employee_created` Kafka event — auth-service consumes that event
 * (storeOrInvite) to create/attach the central-auth account and email the
 * invitation/setup link, so no password is sent here. Accepts the full
 * profile payload (not just InviteUserData's identity fields) since the
 * backend persists both in the same call.
 */
export async function inviteUser(
  data: InviteUserData | UpdateEmployeeData,
): Promise<ActionResponse<UserResource>> {
  try {
    // workspace-service's local tenant row requires a password even though
    // the invited employee never uses it — they set their real password via
    // the invitation email auth-service sends off the employee_created
    // event, same as the bulk-import path (UsersImport::password).
    const payload = { ...data, password: randomBytes(12).toString("hex") };
    const response = await api.post("/workspace/users", payload);
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

/** Flat map of employee/profile fields for pre-filling a document — see ContractAutoFiller (backend). */
export async function getUserContractFields(id: string): Promise<ActionResponse<Record<string, string>>> {
  try {
    const response = await api.get(`/workspace/users/${id}/contract-fields`);
    return { success: true, data: response.data.data };
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
  password?: string;
  // EmployeeService::update() overwrites department_id/position_id
  // unconditionally from whatever is present in the payload (missing means
  // null, wiping the assignment) — callers must carry the user's current
  // values forward rather than omit them, unless they mean to clear them.
  department_id?: number | string | null;
  position_id?: number | string | null;
  id_number?: string;
  full_name?: string;
  address?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  hire_date?: string;
  employment_type?: string;
  gross_salary?: string;
  net_salary?: string;
  housing_allowance?: string;
  transportation_allowance?: string;
  other_allowances?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  custom_fields?: Record<string, string>;
  signers?: { role: string; email: string }[];
}

/**
 * Updates the employee's full record (User + Profile) via workspace-service
 * — the only endpoint that actually persists Profile fields and keeps the
 * Kafka employee_updated sync with auth-service intact. The equivalent
 * central-auth route (/auth/users/{id}) only ever touches identity columns
 * and silently drops every Profile field, which is why this used to point
 * there.
 */
export async function updateEmployee(
  id: string,
  data: UpdateEmployeeData,
): Promise<ActionResponse<UserResource>> {
  try {
    const response = await api.put(`/workspace/users/${id}`, data);
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

/**
 * Normalizes whatever shape the permissions catalog comes back in (a flat
 * array of strings, an array of `{ name }`/`{ permission }` objects, or a
 * nested `{ data: [...] }` envelope) into a flat string[].
 */
function normalizePermissionsCatalog(payload: unknown): string[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.data)
      ? (payload as any).data
      : [];

  return list
    .map((item: unknown) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        if (typeof obj.name === "string") return obj.name;
        if (typeof obj.permission === "string") return obj.permission;
        if (typeof obj.slug === "string") return obj.slug;
      }
      return null;
    })
    .filter((item: string | null): item is string => !!item);
}

/**
 * Full catalog of assignable backend permission strings (e.g.
 * "workspace.project.view"), served by the auth-service. Used to render the
 * permission-assignment checklist on the employee edit form.
 */
export async function getPermissions(): Promise<ActionResponse<string[]>> {
  try {
    const response = await api.get("/auth/permissions");
    return { success: true, data: normalizePermissionsCatalog(response.data) };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export interface AssignUserPermissionsData {
  permissions: string[];
}

export async function assignUserPermissions(
  id: string | number,
  data: AssignUserPermissionsData,
): Promise<ActionResponse<UserResource>> {
  try {
    const response = await api.put(`/auth/users/${id}/permissions`, data);
    return { success: true, data: response.data.data ?? response.data, message: response.data.message };
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
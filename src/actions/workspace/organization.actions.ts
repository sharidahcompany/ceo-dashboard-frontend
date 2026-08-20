"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { getAuthenticatedUser } from "@/actions/workspace/user.actions";
import { PlanResource } from "@/actions/website/plans.actions";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export interface OrganizationResource {
  id: string;
  name: { ar: string; en: string } | string;
  name_localized?: string;
  logo_url?: string | null;
  email?: string;
  phone?: string;
  commercial_number?: string | null;
  tax_number?: string | null;
  building_number?: string | null;
  street?: string | null;
  district?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string;
  currency?: string;
  is_vat_registered?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionResource {
  id: string | number;
  status: "active" | "trialing" | "past_due" | "canceled" | "expired" | string;
  plan?: PlanResource;
  starts_at?: string;
  ends_at?: string;
  trial_ends_at?: string;
  current_period_start?: string;
  current_period_end?: string;
}

/**
 * The auth service scopes tenants by id (GET/PUT /auth/tenants/{id}) rather
 * than exposing a singular "current tenant" route, so the id of the
 * authenticated user's tenant has to be resolved first via /auth/me.
 */
async function getCurrentTenantId(): Promise<string | null> {
  // A user can belong to several tenants; the one they switched to is kept in
  // the "tenant" cookie (also what api.ts sends as X-Tenant), so it wins over
  // the first membership returned by /auth/me.
  const cookieTenant = (await cookies()).get("tenant")?.value;
  if (cookieTenant) return cookieTenant;

  const userRes = await getAuthenticatedUser();
  const tenantId = userRes.success ? userRes.data.tenants?.[0]?.id : undefined;
  return tenantId ? String(tenantId) : null;
}

export interface TenantSummary {
  id: string;
  name: string;
  logo_url?: string | null;
}

function tenantName(tenant: Record<string, any>): string {
  const name = tenant.name_localized ?? tenant.name;
  if (typeof name === "string") return name;
  return name?.ar || name?.en || "";
}

/**
 * The tenants the authenticated user is a member of, used by the sidebar
 * tenant switcher. Returns an empty list rather than an error when /auth/me
 * fails so the sidebar can simply hide the switcher.
 */
export async function getUserTenants(): Promise<ActionResponse<TenantSummary[]>> {
  const userRes = await getAuthenticatedUser();
  if (!userRes.success) return { success: false, error: userRes.error };

  const tenants = (userRes.data.tenants ?? []).map((tenant) => ({
    id: String(tenant.id),
    name: tenantName(tenant),
    logo_url: tenant.logo_url ?? null,
  }));

  return { success: true, data: tenants };
}

/**
 * The tenant every request is currently scoped to.
 */
export async function getActiveTenantId(): Promise<string | null> {
  return getCurrentTenantId();
}

/**
 * Switch the active tenant by rewriting the "tenant" cookie that api.ts turns
 * into the X-Tenant header. Every cached page/query is tenant-scoped, so the
 * whole router cache is invalidated afterwards.
 */
export async function switchTenant(
  tenantId: string,
): Promise<ActionResponse<void>> {
  try {
    const userRes = await getAuthenticatedUser();
    if (!userRes.success) return { success: false, error: userRes.error };

    const isMember = (userRes.data.tenants ?? []).some(
      (tenant) => String(tenant.id) === String(tenantId),
    );
    if (!isMember) {
      return {
        success: false,
        error: getErrorMessage(undefined, "You don't belong to this tenant."),
      };
    }

    (await cookies()).set("tenant", String(tenantId), {
      path: "/",
      sameSite: "lax",
    });
    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Fetch a specific tenant's organization info by id.
 */
export async function getOrganizationById(
  tenantId: string,
): Promise<ActionResponse<OrganizationResource>> {
  try {
    const response = await api.get(`/auth/tenants/${tenantId}`, {
      headers: { "X-Tenant": tenantId },
    });
    return { success: true, data: response.data.data ?? response.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Fetch the current authenticated user's organization (tenant) info.
 */
export async function getCurrentOrganization(): Promise<
  ActionResponse<OrganizationResource>
> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    return {
      success: false,
      error: getErrorMessage(
        undefined,
        "No tenant found for the current user.",
      ),
    };
  }

  return getOrganizationById(tenantId);
}

/**
 * Fetch the current tenant's active subscription and plan.
 */
export async function getCurrentSubscription(): Promise<
  ActionResponse<SubscriptionResource>
> {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return {
        success: false,
        error: getErrorMessage(
          undefined,
          "No tenant found for the current user.",
        ),
      };
    }

    const response = await api.get(`/auth/tenants/${tenantId}/subscription`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Update the current tenant's organization info. Accepts a FormData so a
 * logo file can be uploaded alongside the other fields. PUT is spoofed via
 * _method since multipart requests can't use a real PUT verb.
 */
export async function updateOrganization(
  formData: FormData,
): Promise<ActionResponse<OrganizationResource>> {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return {
        success: false,
        error: getErrorMessage(
          undefined,
          "No tenant found for the current user.",
        ),
      };
    }

    formData.append("_method", "PUT");
    const response = await api.post(`/auth/tenants/${tenantId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    revalidatePath("/[locale]/organization", "page");
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

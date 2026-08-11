"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { getAuthenticatedUser } from "@/actions/workspace/user.actions";
import { PlanResource } from "@/actions/website/plans.actions";
import { revalidatePath } from "next/cache";

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
  const userRes = await getAuthenticatedUser();
  const tenantId = userRes.success ? userRes.data.tenants?.[0]?.id : undefined;
  return tenantId ? String(tenantId) : null;
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

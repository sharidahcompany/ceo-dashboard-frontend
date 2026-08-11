"use server";

import { getAuthenticatedUser } from "@/actions/workspace/user.actions";
import { getSubsidiaries } from "@/actions/auditor/auditor.actions";
import { getOrganizationById } from "@/actions/workspace/organization.actions";
import { getBranches, BranchResource } from "@/actions/company-spirit/branch.actions";
import {
  getActiveMissionLocations,
  ActiveMissionLocations,
} from "@/actions/workspace/missions.actions";
import {
  getActiveCarLocations,
  ActiveCarLocations,
} from "@/actions/workspace/cars.actions";
import { ActionResponse } from "@/actions/common/common.actions";
import { getErrorMessage } from "@/lib/utils";

export interface TenantBranch {
  branch: BranchResource;
  tenantId: string;
  tenantName: string;
  logoUrl?: string | null;
}

interface ResolvedTenant {
  id: string;
  name: string;
  logoUrl?: string | null;
}

function localizedName(name: unknown, fallback: string): string {
  if (typeof name === "string" && name) return name;
  if (name && typeof name === "object") {
    const values = Object.values(name as Record<string, string>).filter(
      Boolean,
    );
    if (values.length > 0) return values[0];
  }
  return fallback;
}

/**
 * Resolves every tenant the current user has visibility into: the tenants
 * they belong to directly, plus any companies (subsidiaries) that have
 * accepted them as an auditor. Own tenants don't carry a logo on /auth/me,
 * so it's backfilled via /auth/tenants/{id}; subsidiaries already carry a
 * logo on the audit-request resource.
 */
async function resolveVisibleTenants(): Promise<ResolvedTenant[]> {
  const [userRes, subsRes] = await Promise.all([
    getAuthenticatedUser(),
    getSubsidiaries(),
  ]);

  const tenants = new Map<string, ResolvedTenant>();

  for (const tenant of userRes.success ? userRes.data.tenants ?? [] : []) {
    const id = String(tenant.id);
    tenants.set(id, {
      id,
      name: localizedName(tenant.name, id),
      logoUrl: tenant.logo_url ?? null,
    });
  }

  for (const request of subsRes.success ? subsRes.data.data : []) {
    const tenant = request.tenant;
    if (!tenant) continue;
    const id = String(tenant.id);
    if (!tenants.has(id)) {
      tenants.set(id, {
        id,
        name: localizedName(tenant.name, id),
        logoUrl: tenant.logo ?? null,
      });
    }
  }

  const ownTenantsMissingLogo = [...tenants.values()].filter(
    (tenant) => !tenant.logoUrl,
  );
  const logoResults = await Promise.all(
    ownTenantsMissingLogo.map((tenant) => getOrganizationById(tenant.id)),
  );
  ownTenantsMissingLogo.forEach((tenant, index) => {
    const orgRes = logoResults[index];
    if (orgRes.success) {
      tenant.logoUrl = orgRes.data.logo_url ?? null;
    }
  });

  return [...tenants.values()];
}

/**
 * Fetches branches across every tenant the user can see (own tenants +
 * audited subsidiaries), tagged with the owning tenant's name/logo, for the
 * cross-tenant branches map.
 */
export async function getAllTenantsBranches(): Promise<
  ActionResponse<TenantBranch[]>
> {
  try {
    const tenants = await resolveVisibleTenants();

    const branchResults = await Promise.all(
      tenants.map((tenant) => getBranches("per_page=1000", tenant.id)),
    );

    const tenantBranches: TenantBranch[] = [];
    tenants.forEach((tenant, index) => {
      const result = branchResults[index];
      if (!result.success) return;
      for (const branch of result.data.data) {
        if (!branch.latitude || !branch.longitude) continue;
        tenantBranches.push({
          branch,
          tenantId: tenant.id,
          tenantName: tenant.name,
          logoUrl: tenant.logoUrl,
        });
      }
    });

    return { success: true, data: tenantBranches };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export interface TenantMission {
  mission: ActiveMissionLocations;
  tenantId: string;
  tenantName: string;
}

/**
 * Fetches every in_progress mission's recorded journey across every tenant
 * the user can see, for the live tracking overlay on the cross-tenant map.
 */
export async function getAllTenantsLiveMissions(): Promise<
  ActionResponse<TenantMission[]>
> {
  try {
    const tenants = await resolveVisibleTenants();

    const missionResults = await Promise.all(
      tenants.map((tenant) => getActiveMissionLocations(tenant.id)),
    );

    const tenantMissions: TenantMission[] = [];
    tenants.forEach((tenant, index) => {
      const result = missionResults[index];
      if (!result.success) return;
      for (const mission of result.data) {
        if (mission.locations.length === 0) continue;
        tenantMissions.push({
          mission,
          tenantId: tenant.id,
          tenantName: tenant.name,
        });
      }
    });

    return { success: true, data: tenantMissions };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export interface TenantCar {
  car: ActiveCarLocations;
  tenantId: string;
  tenantName: string;
}

/**
 * Fetches every GPS-equipped car's recorded journey (checked out or not)
 * across every tenant the user can see, each tagged with an is_online flag
 * (whether Traccar has reported a position recently), for the live tracking
 * overlay on the cross-tenant map.
 */
export async function getAllTenantsLiveCars(): Promise<
  ActionResponse<TenantCar[]>
> {
  try {
    const tenants = await resolveVisibleTenants();

    const carResults = await Promise.all(
      tenants.map((tenant) => getActiveCarLocations(tenant.id)),
    );

    const tenantCars: TenantCar[] = [];
    tenants.forEach((tenant, index) => {
      const result = carResults[index];
      if (!result.success) return;
      for (const car of result.data) {
        if (car.locations.length === 0) continue;
        tenantCars.push({
          car,
          tenantId: tenant.id,
          tenantName: tenant.name,
        });
      }
    });

    return { success: true, data: tenantCars };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

"use client";

import React, { useMemo } from "react";
import { Can, AbilityProvider as CaslAbilityProvider, useAbility as useCaslAbility } from "@casl/react";
import { AppAbility, buildAbility, hasPermission, isExemptFromPermissionChecks } from "@/lib/ability";
import { useAppStore } from "./StoreProvider";

export { Can };

export function AbilityProvider({ children }: { children: React.ReactNode }) {
  const permissions = useAppStore((state) => state.permissions);
  const roles = useAppStore((state) => state.roles);
  const tenantRole = useAppStore((state) => state.user?.tenant_role);

  const ability = useMemo(
    () => buildAbility(permissions, roles, tenantRole),
    [permissions, roles, tenantRole],
  );

  return <CaslAbilityProvider value={ability}>{children}</CaslAbilityProvider>;
}

export function useAbility(): AppAbility {
  return useCaslAbility<AppAbility>();
}

/**
 * Checks a full backend permission string, e.g. useCan("workspace.project.create").
 * Users with an exempt role (super-admin/owner) always get `true` — the ability
 * built for them grants "manage all", which `.can` resolves regardless of the
 * subject/action passed in.
 */
export function useCan(permission: string): boolean {
  const ability = useAbility();
  return hasPermission(ability, permission);
}

/**
 * True only for super-admin/owner (platform-wide or scoped to the current
 * tenant). Use this instead of `useCan` for actions that have no backend
 * permission string and should be restricted to those roles specifically,
 * e.g. editing organization-level settings.
 */
export function useIsOwnerOrSuperAdmin(): boolean {
  const roles = useAppStore((state) => state.roles);
  const tenantRole = useAppStore((state) => state.user?.tenant_role);
  return isExemptFromPermissionChecks(roles, tenantRole);
}

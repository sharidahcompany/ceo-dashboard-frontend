import { Ability, AbilityBuilder, type AbilityClass } from "@casl/ability";

/**
 * Backend permission strings look like "workspace.project.view" —
 * "{service}.{resource}.{action}". CASL subjects are the "service.resource"
 * part and actions are the trailing segment, so `ability.can("view", "workspace.project")`
 * lines up directly with the permission string the backend/Redis hands us.
 */
export type AppAbility = Ability<[string, string]>;
const AppAbility = Ability as AbilityClass<AppAbility>;

const EXEMPT_ROLES = ["super-admin", "owner"];

function permissionToRule(permission: string): { action: string; subject: string } {
  const segments = permission.split(".");
  const action = segments.pop() ?? permission;
  const subject = segments.join(".");
  return { action, subject };
}

/**
 * Users holding a super-admin/owner role (platform-wide or scoped to the
 * current tenant) bypass every permission check.
 */
export function isExemptFromPermissionChecks(roles?: string[] | null, tenantRole?: string | null): boolean {
  if (tenantRole && EXEMPT_ROLES.includes(tenantRole)) return true;
  if (!roles) return false;
  return roles.some((role) => EXEMPT_ROLES.includes(role));
}

export function buildAbility(
  permissions: string[] | undefined,
  roles: string[] | undefined,
  tenantRole: string | null | undefined,
): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(AppAbility);

  if (isExemptFromPermissionChecks(roles, tenantRole)) {
    can("manage", "all");
  } else {
    (permissions ?? []).forEach((permission) => {
      const { action, subject } = permissionToRule(permission);
      can(action, subject);
    });
  }

  return build();
}

export const anonymousAbility = buildAbility([], [], null);

/** Checks a full backend permission string against a built ability. */
export function hasPermission(ability: AppAbility, permission: string): boolean {
  const { action, subject } = permissionToRule(permission);
  return ability.can(action, subject);
}

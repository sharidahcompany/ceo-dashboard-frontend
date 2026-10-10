"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useAbility,
  useIsSuperAdmin,
} from "@/providers/AbilityProvider";
import {
  hasPermission,
  isExemptFromPermissionChecks,
} from "@/lib/ability";
import { useAppStore } from "@/providers/StoreProvider";

const governanceTabs = [
  {
    path: "bodies",
    title: "routes.governance_bodies",
    permission: "workspace.governance_body.view",
  },
  {
    path: "meetings",
    title: "routes.governance_meetings",
    permission: "workspace.governance_meeting.view",
  },
  {
    path: "elections",
    title: "routes.governance_elections",
    permission: "workspace.governance_election.view",
  },
  {
    path: "approvals",
    title: "routes.enterprise_approvals",
    permission: "workspace.enterprise_approval.view",
  },
  {
    path: "transitions",
    title: "routes.governance_transitions",
    permission: "workspace.governance_transition.view",
  },
  {
    path: "championship",
    title: "routes.ceo_championship",
    permission: "workspace.ceo_championship.view",
  },
] as const;

export default function GovernanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations();
  const ability = useAbility();

  const roles =
    useAppStore((state) => state.roles);

  const tenantRole =
    useAppStore(
      (state) => state.user?.tenant_role,
    );

  const isSuperAdmin = useIsSuperAdmin();

  const permissionExempt =
    isSuperAdmin
    || isExemptFromPermissionChecks(
      roles,
      tenantRole,
    );

  const visibleTabs =
    governanceTabs.filter(
      (tab) =>
        permissionExempt
        || hasPermission(
          ability,
          tab.permission,
        ),
    );

  const activeTab =
    visibleTabs.find((tab) =>
      pathname.includes(
        `/governance/${tab.path}`,
      ),
    )?.path
    ?? visibleTabs[0]?.path
    ?? "";

  return (
    <div className="space-y-5">
      {visibleTabs.length > 0 && (
        <Tabs value={activeTab}>
          <TabsList
            variant="line"
            className="max-w-full overflow-x-auto justify-start"
          >
            {visibleTabs.map((tab) => (
              <TabsTrigger
                key={tab.path}
                value={tab.path}
                render={
                  <Link
                    href={`/governance/${tab.path}`}
                  />
                }
              >
                {t(tab.title)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {children}
    </div>
  );
}

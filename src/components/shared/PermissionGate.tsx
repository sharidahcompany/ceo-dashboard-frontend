"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { useCan, useIsSuperAdmin } from "@/providers/AbilityProvider";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function PermissionGate({
  permission,
  superAdminOnly = false,
  children,
}: {
  /** Backend permission string. Omit when gating on `superAdminOnly` alone. */
  permission?: string;
  /** Platform-level content: super-admin only, tenant owners excluded. */
  superAdminOnly?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  // Hooks can't be called conditionally, so both checks always run and the
  // unused one is ignored.
  const can = useCan(permission ?? "");
  const isSuperAdmin = useIsSuperAdmin();
  const allowed = superAdminOnly
    ? isSuperAdmin
    : permission
      ? can
      : true;

  if (!allowed) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlert className="h-4 w-4" />
          </EmptyMedia>
          <EmptyTitle>{t("messages.no_permission_title")}</EmptyTitle>
          <EmptyDescription>
            {t("messages.no_permission_description")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <>{children}</>;
}

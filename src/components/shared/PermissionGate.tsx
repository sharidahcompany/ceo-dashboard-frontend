"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { useCan } from "@/providers/AbilityProvider";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function PermissionGate({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const allowed = useCan(permission);

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

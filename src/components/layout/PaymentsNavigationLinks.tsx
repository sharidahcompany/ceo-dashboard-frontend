"use client";

import { useEffect, useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { getAuthenticatedUser } from "@/actions/workspace/user.actions";
import { getActiveTenantId } from "@/actions/workspace/organization.actions";

type TenantMembership = {
  id?: string | number;
  pivot?: {
    role?: string | null;
    status?: string | null;
  } | null;
};

type Access = {
  owner: boolean;
  superAdmin: boolean;
};

export default function PaymentsNavigationLinks() {
  const pathname = usePathname();
  const [access, setAccess] = useState<Access>({
    owner: false,
    superAdmin: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      try {
        const [result, tenantId] = await Promise.all([
          getAuthenticatedUser(),
          getActiveTenantId(),
        ]);

        if (!result.success || !result.data) return;

        const memberships: TenantMembership[] =
          Array.isArray(result.data.tenants) ? result.data.tenants : [];

        const owner = Boolean(tenantId) && memberships.some(
          (membership) =>
            String(membership.id ?? "") === String(tenantId) &&
            membership.pivot?.role === "owner" &&
            membership.pivot?.status === "accepted",
        );

        const superAdmin =
          Array.isArray(result.data.roles) &&
          result.data.roles.includes("super-admin");

        if (!cancelled) {
          setAccess({ owner, superAdmin });
        }
      } catch {
        // Fail closed: display neither link if verification fails.
      }
    }

    void loadAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!access.owner && !access.superAdmin) return null;

  return (
    <nav
      aria-label="التنقل بين واجهات المدفوعات"
      className="flex flex-col items-center gap-5"
    >
      {access.owner && (
        <Link
          href="/payments"
          aria-label="مدفوعات منشآتي"
          title="مدفوعات منشآتي"
          className={
            pathname === "/payments"
              ? "text-primary"
              : "text-muted-foreground"
          }
        >
          <CreditCard size={20} aria-hidden="true" />
        </Link>
      )}

      {access.superAdmin && (
        <Link
          href="/platform/payments"
          aria-label="إدارة مدفوعات المنصة"
          title="إدارة مدفوعات المنصة"
          className={
            pathname === "/platform/payments"
              ? "text-primary"
              : "text-muted-foreground"
          }
        >
          <ShieldCheck size={20} aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}

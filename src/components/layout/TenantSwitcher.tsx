"use client";

import React from "react";
import { Building2, Check, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  getUserTenants,
  getActiveTenantId,
  switchTenant,
  TenantSummary,
} from "@/actions/workspace/organization.actions";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

function TenantAvatar({
  tenant,
  className,
}: {
  tenant: Pick<TenantSummary, "name" | "logo_url"> | null;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {tenant?.logo_url && (
        <AvatarImage src={tenant.logo_url} alt={tenant.name} />
      )}
      <AvatarFallback>
        <Building2 className="size-4 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  );
}

const subscriptionsUrl = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_URL;

export default function TenantSwitcher() {
  const t = useTranslations();
  const router = useRouter();
  const [tenants, setTenants] = React.useState<TenantSummary[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [switchingId, setSwitchingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([getUserTenants(), getActiveTenantId()]).then(([res, id]) => {
      if (res.success) setTenants(res.data);
      setActiveId(id);
    });
  }, []);

  const activeTenant =
    tenants.find(
      (tenant) => tenant.id === activeId
    ) ?? null;

  async function handleSelect(tenantId: string) {
    if (tenantId === activeTenant?.id) return;

    setSwitchingId(tenantId);
    const res = await switchTenant(tenantId);
    setSwitchingId(null);

    if (!res.success) {
      toast.error(res.error);
      return;
    }

    setActiveId(tenantId);
    // Every query and cached page is tenant-scoped, so start over from the
    // dashboard with a full reload rather than trying to refresh in place.
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center">
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer">
          <TenantAvatar tenant={activeTenant} className="size-8" />
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="end" className="w-56">
          {tenants.length > 1 && (
            <>
              {/* GroupLabel only works inside a Group in Base UI. */}
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t("organization.switch_tenant")}
                </DropdownMenuLabel>
                {tenants.map((tenant) => (
                  <DropdownMenuItem
                    key={tenant.id}
                    className="gap-2"
                    disabled={switchingId !== null}
                    closeOnClick={false}
                    onClick={() => handleSelect(tenant.id)}
                  >
                    <TenantAvatar tenant={tenant} className="size-6" />
                    <span className="truncate">{tenant.name}</span>
                    {switchingId === tenant.id ? (
                      <Loader2 className="ms-auto size-4 animate-spin" />
                    ) : (
                      tenant.id === activeTenant?.id && (
                        <Check className="ms-auto size-4" />
                      )
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
            </>
          )}

          {/* The active tenant again, as the way into its profile page —
              selecting it in the list above only switches, it doesn't
              navigate. Shown even for single-tenant users, who get no list. */}
          <DropdownMenuItem
            className="gap-2"
            onClick={() => router.push("/organization")}
          >
            <TenantAvatar tenant={activeTenant} className="size-6" />
            <span className="truncate">
              {activeTenant?.name || t("organization.title")}
            </span>
          </DropdownMenuItem>

          {subscriptionsUrl && (
            <DropdownMenuItem
              className="gap-2"
              onClick={() => {
                window.location.href = subscriptionsUrl;
              }}
            >
              <Plus className="size-4" />
              <span className="truncate">{t("organization.add_tenant")}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

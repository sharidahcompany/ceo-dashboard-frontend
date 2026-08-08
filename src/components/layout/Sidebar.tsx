"use client";
import React from "react";
import { Building2 } from "lucide-react";
import Logo from "../common/Logo";
import { routes, isRouteVisible } from "@/app/routes";
import DynamicIcon from "../common/DynamicIcon";
import { Link, usePathname } from "@/i18n/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getCurrentOrganization, OrganizationResource } from "@/actions/workspace/organization.actions";
import { useAbility } from "@/providers/AbilityProvider";

function organizationName(org: OrganizationResource | null): string {
  if (!org) return "";
  if (org.name_localized) return org.name_localized;
  if (typeof org.name === "string") return org.name;
  return org.name?.ar || org.name?.en || "";
}

export default function Sidebar() {
  const activePathname = usePathname();
  const t = useTranslations();
  const ability = useAbility();
  const [organization, setOrganization] = React.useState<OrganizationResource | null>(null);

  const visibleRoutes = routes.filter((route) => isRouteVisible(route, ability));

  React.useEffect(() => {
    getCurrentOrganization().then((res) => {
      if (res.success) setOrganization(res.data);
    });
  }, []);

  return (
    <div className="hidden md:flex flex-col justify-between items-center gap-5 md:w-16 shrink-0 py-3 px-2 h-screen border-e">
      <Logo />

      <div className="flex flex-col gap-7">
        {visibleRoutes.map((route) => {
          const isActive =
            route.path === "/"
              ? activePathname === "/"
              : activePathname.includes(route.path);

          return (
            <div key={route.path}>
              <Link href={route.path}>
                <Tooltip>
                  <TooltipTrigger className="cursor-pointer">
                    {route.icon && (
                      <DynamicIcon
                        name={route.icon}
                        size={20}
                        className={
                          isActive ? "text-primary" : "text-muted-foreground"
                        }
                      />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>{t(route.title)}</TooltipContent>
                </Tooltip>
              </Link>
            </div>
          );
        })}
      </div>

      <div>
        <Link href="/organization">
          <Avatar className="cursor-pointer">
            {organization?.logo_url && (
              <AvatarImage
                src={organization.logo_url}
                alt={organizationName(organization)}
                className="w-8 h-8"
              />
            )}
            <AvatarFallback>
              <Building2 className="size-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </div>
  );
}

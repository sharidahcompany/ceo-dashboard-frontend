"use client";
import React from "react";
import Logo from "../common/Logo";
import { routes, isRouteVisible } from "@/app/routes";
import DynamicIcon from "../common/DynamicIcon";
import { Link, usePathname } from "@/i18n/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useTranslations } from "next-intl";
import TenantSwitcher from "./TenantSwitcher";
import { useAbility, useIsSuperAdmin } from "@/providers/AbilityProvider";

export default function Sidebar() {
  const activePathname = usePathname();
  const t = useTranslations();
  const ability = useAbility();
  const isSuperAdmin = useIsSuperAdmin();

  const visibleRoutes = routes.filter((route) =>
    isRouteVisible(route, ability, isSuperAdmin),
  );

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

      <TenantSwitcher />
    </div>
  );
}

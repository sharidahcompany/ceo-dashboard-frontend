"use client";
import React from "react";
import { routes } from "@/app/routes";
import { usePathname, Link } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useTranslations } from "next-intl";
import DynamicIcon from "../common/DynamicIcon";

export default function Tabbar() {
  const pathname = usePathname();
  const t = useTranslations();

  const cleanPath = pathname.replace(/^\/+|\/+$/g, "");
  const pathSegments = cleanPath.split("/");

  const activeService = routes.find((route) => {
    const routeCleanPath = route.path.replace(/^\/+|\/+$/g, "");
    return routeCleanPath === pathSegments[0];
  });

  if (!activeService || !activeService.children) return null;

  const activeTabValue =
    pathSegments[1] || activeService.children[0]?.path || "";

  return (
    <div className="w-full border-b">
      <Tabs value={activeTabValue}>
        <TabsList variant={"line"}>
          {activeService.children.map((child) => {
            const fullPath = `${activeService.path}/${child.path}`;

            return (
              <TabsTrigger
                key={child.path}
                value={child.path}
                className={"px-3"}
              >
                <Link href={fullPath} className="w-full">
                  <div className="w-full flex items-center gap-1">
                    {" "}
                    <span>
                      {child.icon && (
                        <DynamicIcon name={child.icon} size={20} />
                      )}
                    </span>{" "}
                    {t(child.title)}
                  </div>
                </Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}

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
  const pathSegments = cleanPath.split("/").filter(Boolean);

  if (pathSegments.length === 0) return null;

  const activeService = routes.find((route) => {
    const routeCleanPath = route.path.replace(/^\/+|\/+$/g, "");
    return routeCleanPath === pathSegments[0];
  });

  if (!activeService || !activeService.children) return null;

  let activeTabChildren = activeService.children;
  let basePath = activeService.path;

  if (pathSegments.length > 1) {
    const nextSegment = pathSegments[1];
    const childMatch = activeService.children.find((r) => {
      const cleaned = r.path.replace(/^\/+|\/+$/g, "");
      return (
        cleaned === nextSegment ||
        (cleaned.startsWith("[") && cleaned.endsWith("]"))
      );
    });

    if (childMatch && childMatch.children && childMatch.children.length > 0) {
      activeTabChildren = childMatch.children;
      basePath = `${activeService.path}/${nextSegment}`;
    }
  }

  const activeTabValue =
    pathSegments[pathSegments.length - 1] || activeTabChildren[0]?.path || "";

  return (
    <div className="w-full border-b">
      <Tabs value={activeTabValue}>
        <TabsList variant={"line"}>
          {activeTabChildren.map((child) => {
            const rawChildPath = child.path.replace(/^\/+|\/+$/g, "");
            const actualSegment =
              rawChildPath.startsWith("[") && rawChildPath.endsWith("]")
                ? pathSegments[1] || ""
                : rawChildPath;

            if (!actualSegment || actualSegment.includes("[")) return null;

            const fullPath = `${basePath}/${actualSegment}`.replace(/\/+/g, "/");

            return (
              <TabsTrigger
                key={child.path}
                value={child.path}
                className={"px-3"}
              >
                <Link href={fullPath} className="w-full">
                  <div className="w-full flex items-center gap-1">
                    <span>
                      {child.icon && (
                        <DynamicIcon name={child.icon} size={20} />
                      )}
                    </span>
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

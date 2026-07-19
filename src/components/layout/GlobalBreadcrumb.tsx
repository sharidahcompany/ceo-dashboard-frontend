"use client";

import React from "react";
import { usePathname, Link } from "@/i18n/navigation";
import { Route, routes } from "@/app/routes";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

interface BreadcrumbItemType {
  title: string;
  href: string;
  isLast: boolean;
}

export default function GlobalBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations();

  const cleanPath = pathname.replace(/^\/+|\/+$/g, "");
  if (!cleanPath) return null;

  const pathSegments = cleanPath.split("/");

  const findSegmentsData = (
    currentRoutes: Route[] | undefined,
    segmentIndex: number,
    accumulatedPath: string,
  ): BreadcrumbItemType[] => {
    if (segmentIndex >= pathSegments.length || !currentRoutes) return [];

    const currentSegment = pathSegments[segmentIndex];
    const match = currentRoutes.find(
      (r) => r.path.replace(/^\/+|\/+$/g, "") === currentSegment,
    );

    if (!match) return [];

    const nextPath = `${accumulatedPath}/${match.path.replace(/^\/+|\/+$/g, "")}`;
    const isLast = segmentIndex === pathSegments.length - 1;

    const item: BreadcrumbItemType = {
      title: match.title,
      href: nextPath,
      isLast,
    };

    return [
      item,
      ...findSegmentsData(match.children, segmentIndex + 1, nextPath),
    ];
  };

  const breadcrumbItems = findSegmentsData(routes, 0, "");

  if (breadcrumbItems.length === 0) return null;

  return (
    <Breadcrumb className="py-3 px-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>
            {t("routes.home")}
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {breadcrumbItems.map((item) => (
          <React.Fragment key={item.href}>
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{t(item.title)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={item.href} />}>
                  {t(item.title)}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>

            {!item.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

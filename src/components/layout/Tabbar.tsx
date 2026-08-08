"use client";
import React, { useRef, useState, useEffect } from "react";
import { routes, isRouteVisible } from "@/app/routes";
import { usePathname, Link } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useTranslations } from "next-intl";
import DynamicIcon from "../common/DynamicIcon";
import { useAbility } from "@/providers/AbilityProvider";

export default function Tabbar() {
  const pathname = usePathname();
  const t = useTranslations();
  const ability = useAbility();

  const cleanPath = pathname.replace(/^\/+|\/+$/g, "");
  const pathSegments = cleanPath.split("/").filter(Boolean);

  const tabsListRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [hasDragged, setHasDragged] = useState(false);

  useEffect(() => {
    const el = tabsListRef.current;
    if (!el) return;

    // Convert vertical mouse wheel scroll to horizontal scroll
    const handleWheelEvent = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheelEvent);
    };
  }, []);

  if (pathSegments.length === 0) return null;

  const activeService = routes.find((route) => {
    const routeCleanPath = route.path.replace(/^\/+|\/+$/g, "");
    return routeCleanPath === pathSegments[0];
  });

  if (!activeService || !activeService.children) return null;

  const activeTabChildren = activeService.children.filter((child) =>
    isRouteVisible(child, ability),
  );
  const basePath = activeService.path;

  const activeTabValue = pathSegments[1] || activeTabChildren[0]?.path || "";

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = tabsListRef.current;
    if (!el) return;
    isDown.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
    setHasDragged(false);
  };

  const handleMouseLeave = () => {
    isDown.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDown.current) return;
    const el = tabsListRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Scroll speed multiplier
    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
    el.scrollLeft = scrollLeft.current - walk;
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasDragged) {
      e.preventDefault();
    }
  };

  return (
    <div className="w-full border-b">
      <Tabs value={activeTabValue} className="w-full">
        <TabsList
          ref={tabsListRef}
          variant={"line"}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="max-w-full overflow-x-auto overflow-y-hidden flex-nowrap justify-start no-scrollbar cursor-grab active:cursor-grabbing select-none touch-pan-x"
        >
          {activeTabChildren.map((child) => {
            const rawChildPath = child.path.replace(/^\/+|\/+$/g, "");
            const actualSegment =
              rawChildPath.startsWith("[") && rawChildPath.endsWith("]")
                ? pathSegments[1] || ""
                : rawChildPath;

            if (!actualSegment || actualSegment.includes("[")) return null;

            const fullPath = `${basePath}/${actualSegment}`.replace(
              /\/+/g,
              "/",
            );

            return (
              <TabsTrigger
                key={child.path}
                value={child.path}
                className="px-3 shrink-0"
              >
                <Link
                  href={fullPath}
                  className="w-full"
                  onClick={handleLinkClick}
                >
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

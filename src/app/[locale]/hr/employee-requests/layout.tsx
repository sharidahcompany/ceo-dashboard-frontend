"use client";
import React from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAbility } from "@/providers/AbilityProvider";
import { hasPermission } from "@/lib/ability";

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const t = useTranslations();
    const ability = useAbility();

    const allTabs = [
        { path: "leave-requests", title: t("routes.leave_requests"), permission: "workspace.attendance_permission.view" },
        { path: "mission-requests", title: t("routes.mission_requests"), permission: "workspace.mission.view" },
        { path: "scholarship-requests", title: t("routes.scholarship_requests"), permission: "workspace.scholarship_request.view" },
    ];
    const tabs = allTabs.filter((tab) => hasPermission(ability, tab.permission));

    const activeTab = tabs.find(tab => pathname.includes(tab.path))?.path || tabs[0]?.path || "";

    return (
        <div className="space-y-6">
            <div className="border-b">
                <Tabs value={activeTab}>
                    <TabsList variant="line">
                        {tabs.map(tab => (
                            <TabsTrigger key={tab.path} value={tab.path}>
                                <Link href={`/hr/employee-requests/${tab.path}`}>
                                    {tab.title}
                                </Link>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>
            <div>{children}</div>
        </div>
    );
}

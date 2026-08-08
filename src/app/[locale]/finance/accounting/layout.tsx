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
        { path: "accounts", title: t("routes.accounts") || "Chart of Accounts", permission: "finance.account.view" },
        { path: "manual-journals", title: t("routes.manual_journals") || "Manual Journals", permission: "finance.journal.view" },
        { path: "tax-rates", title: t("routes.tax_rates") || "Tax Rates", permission: "finance.tax_rate.view" },
        { path: "reports", title: t("routes.reports") || "Reports", permission: "finance.account.view" },
    ];
    const tabs = allTabs.filter((tab) => hasPermission(ability, tab.permission));

    const segments = pathname.split("/");
    const activeTab = tabs.find(tab => segments.includes(tab.path))?.path || tabs[0]?.path || "";

    return (
        <div className="space-y-6">
            <div className="border-b">
                <Tabs value={activeTab}>
                    <TabsList variant="line">
                        {tabs.map(tab => (
                            <TabsTrigger key={tab.path} value={tab.path}>
                                <Link href={`/finance/accounting/${tab.path}`}>
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

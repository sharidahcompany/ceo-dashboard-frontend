"use client";
import React from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const t = useTranslations();

    const tabs = [
        { path: "accounts", title: t("routes.accounts") || "Chart of Accounts" },
        { path: "manual-journals", title: t("routes.manual_journals") || "Manual Journals" },
        { path: "tax-rates", title: t("routes.tax_rates") || "Tax Rates" },
        { path: "reports", title: t("routes.reports") || "Reports" }
    ];

    const segments = pathname.split("/");
    const activeTab = tabs.find(tab => segments.includes(tab.path))?.path || tabs[0].path;

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

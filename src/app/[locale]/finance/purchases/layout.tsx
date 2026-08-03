"use client";
import React from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const t = useTranslations();

    const tabs = [
        { path: "purchase-orders", title: t("routes.purchase_orders") || "Purchase Orders" },
        { path: "bills", title: t("routes.bills") || "Bills" },
        { path: "cash-expenses", title: t("routes.cash_expenses") || "Cash Expenses" },
        { path: "debit-notes", title: t("routes.debit_notes") || "Debit Notes" }
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
                                <Link href={`/finance/purchases/${tab.path}`}>
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

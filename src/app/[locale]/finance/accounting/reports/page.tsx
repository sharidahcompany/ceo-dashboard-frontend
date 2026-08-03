"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DateRangeFilter, DateRange, lastNMonthsRange } from "@/components/ui/date-range-filter";
import { ProfitAndLossReport } from "./_components/profit-and-loss-report";
import { BalanceSheetReport } from "./_components/balance-sheet-report";
import { TrialBalanceReport } from "./_components/trial-balance-report";
import { GeneralLedgerReport } from "./_components/general-ledger-report";

export default function ReportsPage() {
    const t = useTranslations("reports");
    const [range, setRange] = useState<DateRange>(() => lastNMonthsRange(3));
    const [activeTab, setActiveTab] = useState("profit-loss");

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg tracking-tight">{t("title")}</h2>
                    <p className="text-muted-foreground text-sm">{t("description")}</p>
                </div>
                <DateRangeFilter value={range} onChange={setRange} />
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))}>
                <TabsList variant="line">
                    <TabsTrigger value="profit-loss">{t("tabs.profit_loss")}</TabsTrigger>
                    <TabsTrigger value="balance-sheet">{t("tabs.balance_sheet")}</TabsTrigger>
                    <TabsTrigger value="trial-balance">{t("tabs.trial_balance")}</TabsTrigger>
                    <TabsTrigger value="general-ledger">{t("tabs.general_ledger")}</TabsTrigger>
                </TabsList>
                <TabsContent value="profit-loss" className="pt-4">
                    <ProfitAndLossReport from={range.from} to={range.to} />
                </TabsContent>
                <TabsContent value="balance-sheet" className="pt-4">
                    <BalanceSheetReport date={range.to} />
                </TabsContent>
                <TabsContent value="trial-balance" className="pt-4">
                    <TrialBalanceReport date={range.to} />
                </TabsContent>
                <TabsContent value="general-ledger" className="pt-4">
                    <GeneralLedgerReport from={range.from} to={range.to} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

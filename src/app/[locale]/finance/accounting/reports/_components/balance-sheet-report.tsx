"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getBalanceSheet } from "@/actions/finance/financial-reports.actions";
import { useTenantCurrency } from "@/hooks/use-organization";
import { formatCurrency } from "@/lib/currency";

export function BalanceSheetReport({ date }: { date: string }) {
    const t = useTranslations("reports");
    const locale = useLocale();
    const currency = useTenantCurrency();

    const { data: response, isLoading } = useQuery({
        queryKey: ["balance-sheet", date],
        queryFn: () => getBalanceSheet({ date }),
    });

    if (isLoading) {
        return <Skeleton className="h-96 w-full rounded-xl" />;
    }

    if (!response?.success) {
        return <p className="text-sm text-destructive">{response?.error}</p>;
    }

    const data = response.data;

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">{t("as_of", { date: data.date })}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-muted-foreground text-sm font-normal">{t("total_assets")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-medium" style={{ color: "var(--chart-1)" }}>{formatCurrency(data.assets, currency, locale)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-muted-foreground text-sm font-normal">{t("total_liabilities")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-medium" style={{ color: "var(--chart-2)" }}>{formatCurrency(data.liabilities, currency, locale)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-muted-foreground text-sm font-normal">{t("total_equity")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-medium" style={{ color: "var(--chart-3)" }}>{formatCurrency(data.equity.total_equity, currency, locale)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="border rounded-xl overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("line_item")}</TableHead>
                            <TableHead>{t("amount")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">{t("total_assets")}</TableCell>
                            <TableCell>{data.assets.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">{t("total_liabilities")}</TableCell>
                            <TableCell>{data.liabilities.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="ps-6 text-muted-foreground">{t("equity_capital")}</TableCell>
                            <TableCell>{data.equity.capital.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="ps-6 text-muted-foreground">{t("equity_current_earnings")}</TableCell>
                            <TableCell>{data.equity.current_earnings.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-medium bg-muted/50">
                            <TableCell>{t("total_equity")}</TableCell>
                            <TableCell>{data.equity.total_equity.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

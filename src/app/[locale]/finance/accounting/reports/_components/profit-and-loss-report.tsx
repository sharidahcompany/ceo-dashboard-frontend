"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getProfitAndLossReport } from "@/actions/finance/financial-reports.actions";
import { useTenantCurrency } from "@/hooks/use-organization";
import { formatCurrency } from "@/lib/currency";

export function ProfitAndLossReport({ from, to }: { from: string; to: string }) {
    const t = useTranslations("reports");
    const locale = useLocale();
    const currency = useTenantCurrency();

    const { data: response, isLoading } = useQuery({
        queryKey: ["profit-and-loss", from, to],
        queryFn: () => getProfitAndLossReport({ start_month: from.slice(0, 7), end_month: to.slice(0, 7) }),
    });

    const data = response?.success ? response.data.data : [];
    const errorMessage = response && !response.success ? response.error : null;

    const totals = data.reduce(
        (acc, period) => ({
            revenue: acc.revenue + period.revenue,
            expenses: acc.expenses + period.expenses,
            net: acc.net + period.net_profit_loss,
        }),
        { revenue: 0, expenses: 0, net: 0 }
    );

    if (isLoading) {
        return <Skeleton className="h-96 w-full rounded-xl" />;
    }

    if (errorMessage) {
        return <p className="text-sm text-destructive">{errorMessage}</p>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-muted-foreground text-sm font-normal">{t("total_revenue")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-2xl font-medium" style={{ color: "var(--chart-1)" }}>
                            {formatCurrency(totals.revenue, currency, locale)}
                        </p>
                        <Sparkline
                            data={data.map((period) => ({ label: period.period, value: period.revenue }))}
                            color="var(--chart-1)"
                            formatValue={(value) => formatCurrency(value, currency, locale)}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-muted-foreground text-sm font-normal">{t("total_expenses")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-2xl font-medium" style={{ color: "var(--chart-2)" }}>
                            {formatCurrency(totals.expenses, currency, locale)}
                        </p>
                        <Sparkline
                            data={data.map((period) => ({ label: period.period, value: period.expenses }))}
                            color="var(--chart-2)"
                            formatValue={(value) => formatCurrency(value, currency, locale)}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-muted-foreground text-sm font-normal">{t("net_profit_loss")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className={`text-2xl font-medium ${totals.net >= 0 ? "text-success" : "text-destructive"}`}>
                            {formatCurrency(totals.net, currency, locale)}
                        </p>
                        <Sparkline
                            data={data.map((period) => ({ label: period.period, value: period.net_profit_loss }))}
                            color="var(--chart-3)"
                            formatValue={(value) => formatCurrency(value, currency, locale)}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="border rounded-xl bg-card p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--popover)",
                                borderColor: "var(--border)",
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="revenue" name={t("revenue")} fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="expenses" name={t("expenses")} fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Line dataKey="net_profit_loss" name={t("net_profit_loss")} stroke="var(--chart-3)" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="border rounded-xl overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("period")}</TableHead>
                            <TableHead>{t("revenue")}</TableHead>
                            <TableHead>{t("expenses")}</TableHead>
                            <TableHead>{t("net_profit_loss")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((period) => (
                            <TableRow key={period.period}>
                                <TableCell>{period.period}</TableCell>
                                <TableCell>{period.revenue.toFixed(2)}</TableCell>
                                <TableCell>{period.expenses.toFixed(2)}</TableCell>
                                <TableCell className={period.net_profit_loss >= 0 ? "text-success" : "text-destructive"}>
                                    {period.net_profit_loss.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="font-medium bg-muted/50">
                            <TableCell>{t("total")}</TableCell>
                            <TableCell>{totals.revenue.toFixed(2)}</TableCell>
                            <TableCell>{totals.expenses.toFixed(2)}</TableCell>
                            <TableCell className={totals.net >= 0 ? "text-success" : "text-destructive"}>
                                {totals.net.toFixed(2)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

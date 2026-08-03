"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getTrialBalance } from "@/actions/finance/financial-reports.actions";

export function TrialBalanceReport({ date }: { date: string }) {
    const t = useTranslations("reports");
    const locale = useLocale();

    const { data: response, isLoading } = useQuery({
        queryKey: ["trial-balance", date],
        queryFn: () => getTrialBalance({ date }),
    });

    if (isLoading) {
        return <Skeleton className="h-96 w-full rounded-xl" />;
    }

    if (!response?.success) {
        return <p className="text-sm text-destructive">{response?.error}</p>;
    }

    const data = response.data;

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("as_of", { date })}</p>
            <div className="border rounded-xl overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("account_code")}</TableHead>
                            <TableHead>{t("account_name")}</TableHead>
                            <TableHead>{t("classification")}</TableHead>
                            <TableHead>{t("debit")}</TableHead>
                            <TableHead>{t("credit")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.data.map((row) => (
                            <TableRow key={row.code}>
                                <TableCell>{row.code}</TableCell>
                                <TableCell>{row.name[locale] || row.name.en || Object.values(row.name)[0] || "-"}</TableCell>
                                <TableCell className="text-muted-foreground">{row.classification}</TableCell>
                                <TableCell>{row.debit.toFixed(2)}</TableCell>
                                <TableCell>{row.credit.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="font-medium bg-muted/50">
                            <TableCell colSpan={3}>{t("total")}</TableCell>
                            <TableCell>{data.totals.debit.toFixed(2)}</TableCell>
                            <TableCell>{data.totals.credit.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

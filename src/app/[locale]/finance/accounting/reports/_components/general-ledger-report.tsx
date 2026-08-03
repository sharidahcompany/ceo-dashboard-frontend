"use client";

import React, { useMemo, useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Inbox } from "lucide-react";
import { getGeneralLedger } from "@/actions/finance/financial-reports.actions";
import { getAccounts, AccountResource } from "@/actions/finance/account.actions";

function flattenAccounts(accounts: AccountResource[]): AccountResource[] {
    const byId = new Map<number, AccountResource>();
    const visit = (list: AccountResource[]) => {
        for (const account of list) {
            if (!byId.has(account.id)) {
                byId.set(account.id, account);
            }
            if (account.children) {
                visit(account.children);
            }
        }
    };
    visit(accounts);
    return Array.from(byId.values());
}

export function GeneralLedgerReport({ from, to }: { from: string; to: string }) {
    const t = useTranslations("reports");
    const locale = useLocale();
    const [accountId, setAccountId] = useState<string>("all");

    const { data: accountsResponse } = useQuery({
        queryKey: ["accounts", "flat"],
        queryFn: () => getAccounts(),
    });
    const accounts = accountsResponse?.success ? flattenAccounts(accountsResponse.data) : [];

    const { data: response, isLoading } = useQuery({
        queryKey: ["general-ledger", from, to, accountId],
        queryFn: () => getGeneralLedger({
            start_date: from,
            end_date: to,
            account_id: accountId === "all" ? undefined : accountId,
        }),
    });

    const errorMessage = response && !response.success ? response.error : null;

    const accountName = (name: Record<string, string>) => name[locale] || name.en || Object.values(name)[0] || "-";

    const groups = useMemo(
        () => Object.entries(response?.success ? response.data.data : {}),
        [response]
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t("range", { from, to })}</p>
                <Select value={accountId} onValueChange={(value) => setAccountId(value ?? "all")}>
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder={t("all_accounts")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("all_accounts")}</SelectItem>
                        {accounts.map((account) => (
                            <SelectItem key={account.id} value={String(account.id)}>
                                {account.account_code} — {accountName(account.name)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <Skeleton className="h-96 w-full rounded-xl" />
            ) : errorMessage ? (
                <p className="text-sm text-destructive">{errorMessage}</p>
            ) : groups.length === 0 ? (
                <div className="w-full border rounded-xl bg-card p-12 flex flex-col items-center justify-center">
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Inbox className="w-8 h-8 text-muted-foreground" />
                            </EmptyMedia>
                            <EmptyTitle>{t("no_data")}</EmptyTitle>
                        </EmptyHeader>
                        <EmptyContent>
                            <EmptyDescription>{t("no_data_desc")}</EmptyDescription>
                        </EmptyContent>
                    </Empty>
                </div>
            ) : (
                <div className="space-y-6">
                    {groups.map(([id, lines]) => {
                        const totals = lines.reduce(
                            (acc, line) => ({ debit: acc.debit + line.debit, credit: acc.credit + line.credit }),
                            { debit: 0, credit: 0 }
                        );
                        const first = lines[0];
                        return (
                            <div key={id} className="border rounded-xl overflow-hidden bg-card">
                                <div className="px-4 py-3 border-b bg-muted/50">
                                    <p className="font-medium text-sm">
                                        {first.account_code} — {accountName(first.account_name)}
                                    </p>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("date")}</TableHead>
                                            <TableHead>{t("reference")}</TableHead>
                                            <TableHead>{t("description")}</TableHead>
                                            <TableHead>{t("debit")}</TableHead>
                                            <TableHead>{t("credit")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lines.map((line, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{line.date?.slice(0, 10)}</TableCell>
                                                <TableCell>{line.reference || "-"}</TableCell>
                                                <TableCell>{line.description || "-"}</TableCell>
                                                <TableCell>{line.debit.toFixed(2)}</TableCell>
                                                <TableCell>{line.credit.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="font-medium bg-muted/50">
                                            <TableCell colSpan={3}>{t("total")}</TableCell>
                                            <TableCell>{totals.debit.toFixed(2)}</TableCell>
                                            <TableCell>{totals.credit.toFixed(2)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

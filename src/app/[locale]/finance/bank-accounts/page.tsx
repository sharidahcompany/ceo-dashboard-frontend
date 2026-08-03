"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    getBankAccounts,
    deleteBankAccounts,
    BankAccountResource,
} from "@/actions/finance/bank-account.actions";
import { adaptWrappedListAction } from "@/lib/datagrid-adapter";

const fetchBankAccounts = adaptWrappedListAction(getBankAccounts);

export default function BankAccountsPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<BankAccountResource>[]>(
        () => [
            {
                accessorKey: "name_localized",
                header: t("attributes.name") || "Name",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.name_localized || "-"}</span>
                ),
            },
            {
                accessorKey: "type",
                header: t("attributes.type") || "Type",
                cell: ({ row }) => (
                    <Badge variant="outline">{row.original.type?.label || row.original.type?.value || "-"}</Badge>
                ),
            },
            {
                accessorKey: "currency",
                header: t("attributes.currency") || "Currency",
                cell: ({ row }) => row.original.currency_code || row.original.currency || "-",
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteBankAccounts(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<BankAccountResource, any>
                    title={t("routes.bank_accounts") || "Bank Accounts"}
                    fetchAction={fetchBankAccounts}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_bank_account") || "Add Bank Account"}
                />
            </CardContent>
        </Card>
    );
}

"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    getAccounts,
    deleteAccounts,
    AccountResource,
} from "@/actions/finance/account.actions";
import { adaptFlatListAction } from "@/lib/datagrid-adapter";

const fetchAccounts = adaptFlatListAction(getAccounts);

export default function AccountsPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<AccountResource>[]>(
        () => [
            {
                accessorKey: "account_code",
                header: t("attributes.account_code") || "Code",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.account_code}</span>
                ),
            },
            {
                accessorKey: "name_localized",
                header: t("attributes.name") || "Name",
                cell: ({ row }) => row.original.name_localized || "-",
            },
            {
                accessorKey: "classification",
                header: t("attributes.classification") || "Classification",
                cell: ({ row }) => (
                    <Badge variant="outline">{row.original.classification}</Badge>
                ),
            },
            {
                accessorKey: "activity",
                header: t("attributes.activity") || "Activity",
                cell: ({ row }) => row.original.activity?.label || "-",
            },
            {
                accessorKey: "parent",
                header: t("attributes.parent_account") || "Parent Account",
                cell: ({ row }) => row.original.parent?.name_localized || "-",
            },
            {
                accessorKey: "is_locked",
                header: t("attributes.status") || "Status",
                cell: ({ row }) => (
                    <Badge variant={row.original.is_locked ? "outline" : "default"}>
                        {row.original.is_locked
                            ? t("attributes.locked") || "Locked"
                            : t("attributes.active") || "Active"}
                    </Badge>
                ),
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteAccounts(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<AccountResource, any>
                    title={t("routes.accounts") || "Chart of Accounts"}
                    fetchAction={fetchAccounts}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_account") || "Add Account"}
                />
            </CardContent>
        </Card>
    );
}

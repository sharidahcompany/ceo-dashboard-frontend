"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/ui/document-status-badge";
import {
    getCashExpenses,
    deleteCashExpenses,
    CashExpenseResource,
} from "@/actions/finance/cash-expense.actions";

export default function CashExpensesPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<CashExpenseResource>[]>(
        () => [
            {
                accessorKey: "bill_number",
                header: t("attributes.reference_number") || "Expense #",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.bill_number || "-"}</span>
                ),
            },
            {
                accessorKey: "customer",
                header: t("attributes.customer") || "Customer",
                cell: ({ row }) => row.original.customer?.name_localized || row.original.customer?.name?.en || "-",
            },
            {
                accessorKey: "date",
                header: t("attributes.date") || "Date",
                cell: ({ row }) => row.original.date?.slice(0, 10) || "-",
            },
            {
                accessorKey: "total",
                header: t("attributes.total") || "Total",
                cell: ({ row }) => Number(row.original.total || 0).toFixed(2),
            },
            {
                accessorKey: "net_due",
                header: t("attributes.net_due") || "Net Due",
                cell: ({ row }) => Number(row.original.net_due || 0).toFixed(2),
            },
            {
                accessorKey: "status",
                header: t("attributes.status") || "Status",
                cell: ({ row }) => <DocumentStatusBadge status={row.original.status} />,
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteCashExpenses(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<CashExpenseResource, any>
                    title={t("routes.cash_expenses") || "Cash Expenses"}
                    fetchAction={getCashExpenses}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_cash_expense") || "Add Cash Expense"}
                />
            </CardContent>
        </Card>
    );
}

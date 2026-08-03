"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/ui/document-status-badge";
import {
    getPayruns,
    deletePayruns,
    PayrunResource,
} from "@/actions/finance/payrun.actions";
import { adaptWrappedListAction } from "@/lib/datagrid-adapter";

const fetchPayruns = adaptWrappedListAction(getPayruns);

export default function PayrunsPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<PayrunResource>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("attributes.name") || "Name",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.name}</span>
                ),
            },
            {
                accessorKey: "period_start",
                header: t("attributes.period_start") || "Period Start",
                cell: ({ row }) => row.original.period_start?.slice(0, 10) || "-",
            },
            {
                accessorKey: "period_end",
                header: t("attributes.period_end") || "Period End",
                cell: ({ row }) => row.original.period_end?.slice(0, 10) || "-",
            },
            {
                accessorKey: "pay_date",
                header: t("attributes.pay_date") || "Pay Date",
                cell: ({ row }) => row.original.pay_date?.slice(0, 10) || "-",
            },
            {
                accessorKey: "total_net",
                header: t("attributes.net_salary") || "Total Net",
                cell: ({ row }) => Number(row.original.total_net || 0).toFixed(2),
            },
            {
                accessorKey: "status",
                header: t("attributes.status") || "Status",
                cell: ({ row }) => (
                    <DocumentStatusBadge status={row.original.status} label={row.original.status_label} />
                ),
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deletePayruns(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<PayrunResource, any>
                    title={t("routes.payruns") || "Pay Runs"}
                    fetchAction={fetchPayruns}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_payrun") || "Add Pay Run"}
                />
            </CardContent>
        </Card>
    );
}

"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/ui/document-status-badge";
import {
    getPayrolls,
    deletePayrolls,
    PayrollResource,
} from "@/actions/finance/payroll.actions";
import { adaptWrappedListAction } from "@/lib/datagrid-adapter";

const fetchPayrolls = adaptWrappedListAction(getPayrolls);

export default function PayrollPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<PayrollResource>[]>(
        () => [
            {
                accessorKey: "employee_name",
                header: t("attributes.employee_name") || "Employee",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">
                        {row.original.employee_name || row.original.user?.name || "-"}
                    </span>
                ),
            },
            {
                accessorKey: "gross_salary",
                header: t("attributes.gross_salary") || "Gross Salary",
                cell: ({ row }) => Number(row.original.gross_salary || 0).toFixed(2),
            },
            {
                accessorKey: "total_deductions",
                header: t("attributes.total_deductions") || "Deductions",
                cell: ({ row }) => Number(row.original.total_deductions || 0).toFixed(2),
            },
            {
                accessorKey: "net_salary",
                header: t("attributes.net_salary") || "Net Salary",
                cell: ({ row }) => Number(row.original.net_salary || 0).toFixed(2),
            },
            {
                accessorKey: "paid_amount",
                header: t("attributes.paid_amount") || "Paid",
                cell: ({ row }) => Number(row.original.paid_amount || 0).toFixed(2),
            },
            {
                accessorKey: "remaining_amount",
                header: t("attributes.remaining_amount") || "Remaining",
                cell: ({ row }) => Number(row.original.remaining_amount || 0).toFixed(2),
            },
            {
                accessorKey: "payment_status",
                header: t("attributes.payment_status") || "Payment Status",
                cell: ({ row }) => (
                    <DocumentStatusBadge status={row.original.payment_status} label={row.original.payment_status_label} />
                ),
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deletePayrolls(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<PayrollResource, any>
                    title={t("routes.payroll") || "Payroll"}
                    fetchAction={fetchPayrolls}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_payroll") || "Add Payroll"}
                />
            </CardContent>
        </Card>
    );
}

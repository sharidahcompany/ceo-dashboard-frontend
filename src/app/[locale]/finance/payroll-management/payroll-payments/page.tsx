"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/ui/document-status-badge";
import {
    getPayrollPayments,
    deletePayrollPayments,
    PayrollPaymentResource,
} from "@/actions/finance/payroll-payment.actions";

export default function PayrollPaymentsPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<PayrollPaymentResource>[]>(
        () => [
            {
                accessorKey: "payment_date",
                header: t("attributes.payment_date") || "Payment Date",
                cell: ({ row }) => row.original.payment_date?.slice(0, 10) || "-",
            },
            {
                accessorKey: "amount",
                header: t("attributes.amount") || "Amount",
                cell: ({ row }) => Number(row.original.amount || 0).toFixed(2),
            },
            {
                accessorKey: "currency",
                header: t("attributes.currency") || "Currency",
                cell: ({ row }) => row.original.currency || "-",
            },
            {
                accessorKey: "reference",
                header: t("attributes.reference") || "Reference",
                cell: ({ row }) => row.original.reference || "-",
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
        return deletePayrollPayments(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<PayrollPaymentResource, any>
                    title={t("routes.payroll_payments") || "Payroll Payments"}
                    fetchAction={getPayrollPayments}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    editable={false}
                    createTitle={t("routes.create_payroll_payment") || "Add Payment"}
                />
            </CardContent>
        </Card>
    );
}

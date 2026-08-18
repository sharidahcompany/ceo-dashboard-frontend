"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/ui/document-status-badge";
import { saveFileDownload } from "@/lib/download";
import {
    getBills,
    deleteBills,
    importBills,
    exportBills,
    downloadBillImportTemplate,
    downloadBillPdf,
    BillResource,
} from "@/actions/finance/bill.actions";

export default function BillsPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<BillResource>[]>(
        () => [
            {
                accessorKey: "bill_number",
                header: t("attributes.reference_number") || "Bill #",
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
                accessorKey: "due_date",
                header: t("attributes.due_date") || "Due Date",
                cell: ({ row }) => row.original.due_date?.slice(0, 10) || "-",
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
        return deleteBills(numericIds);
    };

    const handleExport = async () => {
        const res = await exportBills();
        if (!res.success) throw new Error(res.error);
        saveFileDownload(res.data);
    };

    const handleDownloadTemplate = async () => {
        const res = await downloadBillImportTemplate();
        if (!res.success) throw new Error(res.error);
        saveFileDownload(res.data);
    };

    const handleImport = async (file: File) => {
        const res = await importBills(file);
        return res.success
            ? { success: true, message: res.message }
            : { success: false, message: res.error, errors: res.errors };
    };

    const handleDownloadPdf = async (item: BillResource) => {
        const res = await downloadBillPdf(item.id);
        if (!res.success) throw new Error(res.error);
        saveFileDownload(res.data);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<BillResource, any>
                    title={t("routes.bills") || "Bills"}
                    fetchAction={getBills}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_bill") || "Add Bill"}
                    importable
                    exportable
                    onExport={handleExport}
                    onDownloadTemplate={handleDownloadTemplate}
                    onImport={handleImport}
                    hasPdf
                    onDownloadPdf={handleDownloadPdf}
                />
            </CardContent>
        </Card>
    );
}

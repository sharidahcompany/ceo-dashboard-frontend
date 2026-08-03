"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/ui/document-status-badge";
import { saveFileDownload } from "@/lib/download";
import {
    getPurchaseOrders,
    deletePurchaseOrders,
    importPurchaseOrders,
    exportPurchaseOrders,
    downloadPurchaseOrderImportTemplate,
    PurchaseOrderResource,
} from "@/actions/finance/purchase-order.actions";

export default function PurchaseOrdersPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<PurchaseOrderResource>[]>(
        () => [
            {
                accessorKey: "purchase_order_number",
                header: t("attributes.reference_number") || "Order #",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.purchase_order_number || "-"}</span>
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
                accessorKey: "status",
                header: t("attributes.status") || "Status",
                cell: ({ row }) => <DocumentStatusBadge status={row.original.status} />,
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deletePurchaseOrders(numericIds);
    };

    const handleExport = async () => {
        const res = await exportPurchaseOrders();
        if (!res.success) throw new Error(res.error);
        saveFileDownload(res.data);
    };

    const handleDownloadTemplate = async () => {
        const res = await downloadPurchaseOrderImportTemplate();
        if (!res.success) throw new Error(res.error);
        saveFileDownload(res.data);
    };

    const handleImport = async (file: File) => {
        const res = await importPurchaseOrders(file);
        return res.success
            ? { success: true, message: res.message }
            : { success: false, message: res.error, errors: res.errors };
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<PurchaseOrderResource, any>
                    title={t("routes.purchase_orders") || "Purchase Orders"}
                    fetchAction={getPurchaseOrders}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_purchase_order") || "Add Purchase Order"}
                    importable
                    exportable
                    onExport={handleExport}
                    onDownloadTemplate={handleDownloadTemplate}
                    onImport={handleImport}
                />
            </CardContent>
        </Card>
    );
}

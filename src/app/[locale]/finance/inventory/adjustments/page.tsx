"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/ui/document-status-badge";
import {
    getInventoryAdjustments,
    deleteInventoryAdjustments,
    InventoryAdjustmentResource,
} from "@/actions/finance/inventory-adjustment.actions";

export default function InventoryAdjustmentsPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<InventoryAdjustmentResource>[]>(
        () => [
            {
                accessorKey: "date",
                header: t("attributes.date") || "Date",
                cell: ({ row }) => row.original.date?.slice(0, 10) || "-",
            },
            {
                accessorKey: "reference",
                header: t("attributes.reference") || "Reference",
                cell: ({ row }) => row.original.reference || "-",
            },
            {
                accessorKey: "warehouse_name",
                header: t("attributes.warehouse") || "Warehouse",
                cell: ({ row }) => row.original.warehouse_name?.name || "-",
            },
            {
                accessorKey: "item_name",
                header: t("attributes.item") || "Item",
                cell: ({ row }) => row.original.item_name?.name_localized || "-",
            },
            {
                accessorKey: "qty",
                header: t("attributes.qty") || "Quantity",
                cell: ({ row }) => row.original.qty ?? "-",
            },
            {
                accessorKey: "total_adjustment_amount",
                header: t("attributes.inventory_value") || "Adjustment Amount",
                cell: ({ row }) =>
                    row.original.total_adjustment_amount != null
                        ? Number(row.original.total_adjustment_amount).toFixed(2)
                        : "-",
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
        return deleteInventoryAdjustments(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<InventoryAdjustmentResource, any>
                    title={t("routes.adjustments") || "Inventory Adjustments"}
                    fetchAction={getInventoryAdjustments}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_adjustment") || "Add Adjustment"}
                />
            </CardContent>
        </Card>
    );
}

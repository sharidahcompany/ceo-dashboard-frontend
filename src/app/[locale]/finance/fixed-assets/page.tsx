"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/ui/document-status-badge";
import {
    getFixedAssets,
    deleteFixedAssets,
    FixedAssetResource,
} from "@/actions/finance/fixed-asset.actions";

export default function FixedAssetsPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<FixedAssetResource>[]>(
        () => [
            {
                accessorKey: "asset_number",
                header: t("attributes.asset_number") || "Asset #",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.asset_number}</span>
                ),
            },
            {
                accessorKey: "name",
                header: t("attributes.name") || "Name",
                cell: ({ row }) => row.original.name || "-",
            },
            {
                accessorKey: "purchase_date",
                header: t("attributes.purchase_date") || "Purchase Date",
                cell: ({ row }) => row.original.purchase_date?.slice(0, 10) || "-",
            },
            {
                accessorKey: "purchase_cost",
                header: t("attributes.purchase_cost") || "Purchase Cost",
                cell: ({ row }) => Number(row.original.purchase_cost || 0).toFixed(2),
            },
            {
                accessorKey: "current_book_value",
                header: t("attributes.current_book_value") || "Book Value",
                cell: ({ row }) => Number(row.original.current_book_value || 0).toFixed(2),
            },
            {
                accessorKey: "status",
                header: t("attributes.status") || "Status",
                cell: ({ row }) => (
                    <DocumentStatusBadge status={row.original.status?.value} label={row.original.status?.label} />
                ),
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteFixedAssets(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<FixedAssetResource, any>
                    title={t("routes.fixed_assets") || "Fixed Assets"}
                    fetchAction={getFixedAssets}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_fixed_asset") || "Add Fixed Asset"}
                />
            </CardContent>
        </Card>
    );
}

"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import {
    getItems,
    deleteItems,
    ItemResource,
} from "@/actions/finance/item.actions";
import { adaptWrappedListAction } from "@/lib/datagrid-adapter";

const fetchItems = adaptWrappedListAction(getItems);

export default function ItemsPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<ItemResource>[]>(
        () => [
            {
                accessorKey: "sku",
                header: t("attributes.sku") || "SKU",
                cell: ({ row }) => row.original.sku || "-",
            },
            {
                accessorKey: "name_localized",
                header: t("attributes.name") || "Name",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.name_localized || "-"}</span>
                ),
            },
            {
                accessorKey: "unit_cost",
                header: t("attributes.unit_cost") || "Unit Cost",
                cell: ({ row }) => (row.original.unit_cost != null ? Number(row.original.unit_cost).toFixed(2) : "-"),
            },
            {
                accessorKey: "unit_price",
                header: t("attributes.unit_price") || "Unit Price",
                cell: ({ row }) => (row.original.unit_price != null ? Number(row.original.unit_price).toFixed(2) : "-"),
            },
            {
                accessorKey: "quantity",
                header: t("attributes.qty") || "Quantity",
                cell: ({ row }) => row.original.quantity ?? "-",
            },
            {
                accessorKey: "warehouse",
                header: t("attributes.warehouse") || "Warehouse",
                cell: ({ row }) => row.original.warehouse?.name || "-",
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteItems(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<ItemResource, any>
                    title={t("routes.items") || "Items"}
                    fetchAction={fetchItems}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_item") || "Add Item"}
                />
            </CardContent>
        </Card>
    );
}

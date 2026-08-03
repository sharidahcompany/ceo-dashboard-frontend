"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import {
    getWarehouses,
    deleteWarehouses,
    WarehouseResource,
} from "@/actions/finance/warehouse.actions";
import { adaptWrappedListAction } from "@/lib/datagrid-adapter";

const fetchWarehouses = adaptWrappedListAction(getWarehouses);

export default function WarehousesPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<WarehouseResource>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("attributes.name") || "Name",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.name}</span>
                ),
            },
            {
                accessorKey: "phone",
                header: t("attributes.phone") || "Phone",
                cell: ({ row }) => row.original.phone || "-",
            },
            {
                accessorKey: "email",
                header: t("attributes.email") || "Email",
                cell: ({ row }) => row.original.email || "-",
            },
            {
                accessorKey: "city",
                header: t("attributes.city") || "City",
                cell: ({ row }) => row.original.city || "-",
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteWarehouses(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<WarehouseResource, any>
                    title={t("routes.warehouses") || "Warehouses"}
                    fetchAction={fetchWarehouses}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_warehouse") || "Add Warehouse"}
                />
            </CardContent>
        </Card>
    );
}

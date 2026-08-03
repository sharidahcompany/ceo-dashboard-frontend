"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { adaptWrappedListAction } from "@/lib/datagrid-adapter";
import {
    getCostCenters,
    deleteCostCenters,
    CostCenterResource,
} from "@/actions/finance/cost-center.actions";

const fetchCostCenters = adaptWrappedListAction(getCostCenters);

export default function CostCentersPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<CostCenterResource>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("attributes.name") || "Name",
                cell: ({ row }) => row.original.name_localized || row.original.name?.en || "-",
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteCostCenters(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<CostCenterResource, any>
                    title={t("routes.cost_centers") || "Cost Centers"}
                    fetchAction={fetchCostCenters}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_cost_center") || "Add Cost Center"}
                />
            </CardContent>
        </Card>
    );
}

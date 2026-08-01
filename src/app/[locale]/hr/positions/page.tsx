"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { getPositions, deletePositions, PositionResource } from "@/actions/workspace/positions.actions";
import { Card, CardContent } from "@/components/ui/card";

export default function PositionsPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<PositionResource>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("attributes.name"),
                cell: ({ row }) => row.original.name_localized || row.original.name?.en,
            },
            {
                accessorKey: "description",
                header: t("attributes.description"),
                cell: ({ row }) => row.original.description_localized || row.original.description?.en || "-",
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
        return deletePositions(numericIds);
    };

    return (
        <Card>
            <CardContent>

                <DataGrid<PositionResource, any>
                    title={t("routes.positions")}
                    description={t("messages.hr.positions_description")}
                    fetchAction={getPositions}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("messages.hr.create_new_position")}
                />
            </CardContent>
        </Card>
    );
}

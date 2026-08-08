"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { getPositions, deletePositions, PositionResource } from "@/actions/workspace/positions.actions";
import { Card, CardContent } from "@/components/ui/card";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { useCan } from "@/providers/AbilityProvider";

export default function PositionsPage() {
    const t = useTranslations();
    const canCreate = useCan("workspace.position.create");
    const canEdit = useCan("workspace.position.update");
    const canDelete = useCan("workspace.position.delete");

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
        <PermissionGate permission="workspace.position.view">
            <Card>
                <CardContent>

                    <DataGrid<PositionResource, any>
                        title={t("routes.positions")}
                        description={t("messages.hr.positions_description")}
                        fetchAction={getPositions}
                        deleteAction={handleDelete}
                        columns={columns}
                        idKey="id"
                        createTitle={canCreate ? t("messages.hr.create_new_position") : undefined}
                        editable={canEdit}
                        deletable={canDelete}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

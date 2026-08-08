"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { getVacancies, deleteVacancies, VacancyResource } from "@/actions/workspace/vacancies.actions";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { useCan } from "@/providers/AbilityProvider";

export default function VacanciesPage() {
    const t = useTranslations();
    const canCreate = useCan("workspace.vacancy.create");
    const canEdit = useCan("workspace.vacancy.update");
    const canDelete = useCan("workspace.vacancy.delete");

    const columns = useMemo<ColumnDef<VacancyResource>[]>(
        () => [
            {
                accessorKey: "title",
                header: t("attributes.title"),
                cell: ({ row }) => row.original.title || "-",
            },
            {
                accessorKey: "description",
                header: t("attributes.description"),
                cell: ({ row }) => row.original.description || "-",
            },
            {
                accessorKey: "position",
                header: t("routes.positions"),
                cell: ({ row }) => row.original.position?.name_localized || row.original.position?.name?.en || "-",
            },
            {
                accessorKey: "start_date",
                header: t("attributes.start_date") || "Start Date",
                cell: ({ row }) => row.original.start_date || "-",
            },
            {
                accessorKey: "end_date",
                header: t("attributes.end_date") || "End Date",
                cell: ({ row }) => row.original.end_date || "-",
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
        return deleteVacancies(numericIds);
    };

    return (
        <PermissionGate permission="workspace.vacancy.view">
            <Card>
                <CardContent>
                    <DataGrid<VacancyResource, any>
                        title={t("routes.vacancies")}
                        description={t("messages.hr.positions_description") || "Manage organization vacancies"}
                        fetchAction={getVacancies}
                        deleteAction={handleDelete}
                        columns={columns}
                        idKey="id"
                        createTitle={canCreate ? t("buttons.create") : undefined}
                        editable={canEdit}
                        deletable={canDelete}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

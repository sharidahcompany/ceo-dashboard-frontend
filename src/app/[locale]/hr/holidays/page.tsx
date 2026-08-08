"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { getHolidays, deleteHolidays, HolidayResource } from "@/actions/workspace/holiday.actions";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { useCan } from "@/providers/AbilityProvider";

export default function HolidaysPage() {
    const t = useTranslations();
    const canCreate = useCan("workspace.holiday.create");
    const canEdit = useCan("workspace.holiday.update");
    const canDelete = useCan("workspace.holiday.delete");

    const columns = useMemo<ColumnDef<HolidayResource>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("attributes.name") || "Holiday Name",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.name}</span>
                ),
            },
            {
                accessorKey: "date",
                header: t("attributes.date") || "Date",
                cell: ({ row }) => row.original.date || "-",
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
        return deleteHolidays(numericIds);
    };

    return (
        <PermissionGate permission="workspace.holiday.view">
            <Card>
                <CardContent>
                    <DataGrid<HolidayResource, any>
                        title={t("routes.holidays") || "Holidays"}
                        description={t("messages.hr.holidays_description") || "Manage organization holidays and official vacations"}
                        fetchAction={getHolidays}
                        deleteAction={handleDelete}
                        columns={columns}
                        idKey="id"
                        createTitle={canCreate ? (t("messages.hr.create_new_holiday") || "Create New Holiday") : undefined}
                        editable={canEdit}
                        deletable={canDelete}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

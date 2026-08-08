"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getShifts, deleteShifts, ShiftResource } from "@/actions/workspace/shifts.actions";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { useCan } from "@/providers/AbilityProvider";

export default function ShiftsPage() {
    const t = useTranslations();
    const canCreate = useCan("workspace.shift.create");
    const canEdit = useCan("workspace.shift.update");
    const canDelete = useCan("workspace.shift.delete");

    const columns = useMemo<ColumnDef<ShiftResource>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("attributes.name") || "Shift Name",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.name}</span>
                ),
            },
            {
                accessorKey: "work_days",
                header: t("attributes.work_days") || "Work Days",
                cell: ({ row }) => {
                    const days = row.original.work_days;
                    if (!days || days.length === 0) return "-";
                    return (
                        <div className="flex flex-wrap gap-1">
                            {days.map(d => (
                                <Badge key={d.value} variant="secondary">
                                    {d.label}
                                </Badge>
                            ))}
                        </div>
                    );
                },
            },
            {
                accessorKey: "start_time",
                header: t("attributes.start_time") || "Start Time",
                cell: ({ row }) => row.original.start_time || "-",
            },
            {
                accessorKey: "end_time",
                header: t("attributes.end_time") || "End Time",
                cell: ({ row }) => row.original.end_time || "-",
            },
            {
                accessorKey: "grace_period",
                header: t("attributes.grace_period") || "Grace Period",
                cell: ({ row }) => {
                    const val = row.original.grace_period;
                    return val !== undefined ? `${val} ${t("attributes.minutes") || "mins"}` : "-";
                },
            },
            {
                accessorKey: "overtime_allowed",
                header: t("attributes.overtime_allowed") || "Overtime Allowed",
                cell: ({ row }) => (
                    <Badge variant={row.original.overtime_allowed ? "default" : "outline"}>
                        {row.original.overtime_allowed ? (t("attributes.yes") || "Yes") : (t("attributes.no") || "No")}
                    </Badge>
                ),
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
        return deleteShifts(numericIds);
    };

    return (
        <PermissionGate permission="workspace.shift.view">
            <Card>
                <CardContent>
                    <DataGrid<ShiftResource, any>
                        title={t("routes.shifts") || "Shifts"}
                        description={t("messages.hr.shifts_description") || "Manage organization work shifts and assignments"}
                        fetchAction={getShifts}
                        deleteAction={handleDelete}
                        columns={columns}
                        idKey="id"
                        createTitle={canCreate ? (t("messages.hr.create_new_shift") || "Create New Shift") : undefined}
                        editable={canEdit}
                        deletable={canDelete}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Car } from "lucide-react";
import {
    getCars,
    deleteCars,
    CarResource,
} from "@/actions/workspace/cars.actions";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { useCan } from "@/providers/AbilityProvider";

export default function CarsPage() {
    const t = useTranslations();
    const canCreate = useCan("workspace.car.create");
    const canEdit = useCan("workspace.car.update");
    const canDelete = useCan("workspace.car.delete");

    const columns = useMemo<ColumnDef<CarResource>[]>(
        () => [
            {
                accessorKey: "model",
                header: t("attributes.model") || "Model",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.model}</span>
                ),
            },
            {
                accessorKey: "year",
                header: t("attributes.year") || "Year",
            },
            {
                accessorKey: "status",
                header: t("attributes.status") || "Status",
                cell: ({ row }) => {
                    const status = row.original.status;
                    const value = status?.value;
                    const label = status?.label || value;
                    const variant = value === "maintenance" ? "destructive" : "default";
                    return <Badge variant={variant}>{label}</Badge>;
                },
            },
            {
                accessorKey: "has_gps",
                header: t("attributes.has_gps") || "GPS",
                cell: ({ row }) =>
                    row.original.has_gps ? (
                        <Badge variant="outline" className="gap-1">
                            <MapPin className="size-3" />
                            {t("attributes.has_gps") || "GPS"}
                        </Badge>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    ),
            },
            {
                accessorKey: "current_assignment",
                header: t("attributes.current_assignment") || "Current Assignment",
                cell: ({ row }) => {
                    const assignment = row.original.current_assignment;
                    if (!assignment)
                        return (
                            <span className="text-muted-foreground">
                                {t("attributes.available") || "Available"}
                            </span>
                        );
                    const name =
                        `${assignment.user?.first_name || ""} ${assignment.user?.last_name || ""}`.trim() ||
                        assignment.user?.username ||
                        "-";
                    return <span>{name}</span>;
                },
            },
        ],
        [t],
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteCars(numericIds);
    };

    return (
        <PermissionGate permission="workspace.car.view">
            <Card>
                <CardContent>
                    <DataGrid<CarResource, any>
                        title={t("routes.cars") || "Cars"}
                        description={
                            t("messages.cars.cars_description") ||
                            "Manage company cars and who currently has them"
                        }
                        fetchAction={getCars}
                        deleteAction={handleDelete}
                        columns={columns}
                        idKey="id"
                        createTitle={
                            canCreate ? t("messages.cars.create_new_car") || "Add Car" : undefined
                        }
                        createIcon={Car}
                        editable={canEdit}
                        deletable={canDelete}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

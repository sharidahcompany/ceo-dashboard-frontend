"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    getAvailableScholarships,
    deleteAvailableScholarships,
    AvailableScholarshipResource
} from "@/actions/workspace/scholarships.actions";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { useCan } from "@/providers/AbilityProvider";

export default function AvailableScholarshipsPage() {
    const t = useTranslations();
    const canCreate = useCan("workspace.scholarship.create");
    const canEdit = useCan("workspace.scholarship.update");
    const canDelete = useCan("workspace.scholarship.delete");

    const columns = useMemo<ColumnDef<AvailableScholarshipResource>[]>(
        () => [
            {
                accessorKey: "title",
                header: t("attributes.title") || "Title",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.title}</span>
                ),
            },
            {
                accessorKey: "description",
                header: t("attributes.description") || "Description",
                cell: ({ row }) => (
                    <span className="text-muted-foreground line-clamp-1 max-w-[250px]">
                        {row.original.description || "-"}
                    </span>
                ),
            },
            {
                accessorKey: "price",
                header: t("attributes.price") || "Price",
                cell: ({ row }) => {
                    const price = row.original.price;
                    return price !== undefined ? `${price.toFixed(2)}` : "-";
                },
            },
            {
                accessorKey: "discount_percentage",
                header: t("attributes.discount_percentage") || "Discount",
                cell: ({ row }) => {
                    const pct = row.original.discount_percentage;
                    return pct !== undefined ? `${pct}%` : "-";
                },
            },
            {
                accessorKey: "final_price",
                header: t("attributes.final_price") || "Final Price",
                cell: ({ row }) => {
                    const final = row.original.final_price;
                    return final !== undefined ? `${final.toFixed(2)}` : "-";
                },
            },
            {
                accessorKey: "duration",
                header: t("attributes.duration") || "Duration",
                cell: ({ row }) => row.original.duration || "-",
            },
            {
                accessorKey: "is_active",
                header: t("attributes.status") || "Status",
                cell: ({ row }) => (
                    <Badge variant={row.original.is_active ? "default" : "outline"}>
                        {row.original.is_active
                            ? t("attributes.active") || "Active"
                            : t("attributes.inactive") || "Inactive"}
                    </Badge>
                ),
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
        return deleteAvailableScholarships(numericIds);
    };

    return (
        <PermissionGate permission="workspace.scholarship.view">
            <Card>
                <CardContent>
                    <DataGrid<AvailableScholarshipResource, any>
                        title={t("routes.available_scholarships") || "Available Scholarships"}
                        description={t("messages.hr.available_scholarships_description") || "Manage available training and academic scholarship programs"}
                        fetchAction={getAvailableScholarships}
                        deleteAction={handleDelete}
                        columns={columns}
                        idKey="id"
                        createTitle={canCreate ? (t("messages.hr.create_new_scholarship") || "Create New Scholarship") : undefined}
                        editable={canEdit}
                        deletable={canDelete}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/ui/document-status-badge";
import {
    getJournals,
    deleteJournals,
    JournalResource,
} from "@/actions/finance/journal.actions";

export default function ManualJournalsPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<JournalResource>[]>(
        () => [
            {
                accessorKey: "date",
                header: t("attributes.date") || "Date",
                cell: ({ row }) => row.original.date?.slice(0, 10) || "-",
            },
            {
                accessorKey: "reference",
                header: t("attributes.reference") || "Reference",
                cell: ({ row }) => row.original.reference || "-",
            },
            {
                accessorKey: "notes",
                header: t("attributes.notes") || "Notes",
                cell: ({ row }) => (
                    <span className="text-muted-foreground line-clamp-1 max-w-[250px]">
                        {row.original.notes || "-"}
                    </span>
                ),
            },
            {
                accessorKey: "debit",
                header: t("attributes.debit") || "Debit",
                cell: ({ row }) => Number(row.original.totals?.debit ?? 0).toFixed(2),
            },
            {
                accessorKey: "credit",
                header: t("attributes.credit") || "Credit",
                cell: ({ row }) => Number(row.original.totals?.credit ?? 0).toFixed(2),
            },
            {
                accessorKey: "status",
                header: t("attributes.status") || "Status",
                cell: ({ row }) => (
                    <DocumentStatusBadge status={row.original.status?.value} label={row.original.status?.label} />
                ),
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteJournals(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<JournalResource, any>
                    title={t("routes.manual_journals") || "Manual Journals"}
                    fetchAction={getJournals}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_manual_journal") || "Create Journal"}
                />
            </CardContent>
        </Card>
    );
}

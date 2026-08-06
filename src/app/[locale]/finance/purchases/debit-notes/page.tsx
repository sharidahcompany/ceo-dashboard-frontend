"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/ui/document-status-badge";
import { saveFileDownload } from "@/lib/download";
import {
    getDebitNotes,
    deleteDebitNotes,
    importDebitNotes,
    exportDebitNotes,
    downloadDebitNoteImportTemplate,
    DebitNoteResource,
} from "@/actions/finance/debit-note.actions";

export default function DebitNotesPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<DebitNoteResource>[]>(
        () => [
            {
                accessorKey: "debit_note_number",
                header: t("attributes.reference_number") || "Debit Note #",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.debit_note_number || "-"}</span>
                ),
            },
            {
                accessorKey: "customer",
                header: t("attributes.customer") || "Customer",
                cell: ({ row }) => row.original.customer?.name_localized || row.original.customer?.name?.en || "-",
            },
            {
                accessorKey: "date",
                header: t("attributes.date") || "Date",
                cell: ({ row }) => row.original.date?.slice(0, 10) || "-",
            },
            {
                accessorKey: "total",
                header: t("attributes.total") || "Total",
                cell: ({ row }) => Number(row.original.total || 0).toFixed(2),
            },
            {
                accessorKey: "net_due",
                header: t("attributes.net_due") || "Net Due",
                cell: ({ row }) => Number(row.original.net_due || 0).toFixed(2),
            },
            {
                accessorKey: "status",
                header: t("attributes.status") || "Status",
                cell: ({ row }) => <DocumentStatusBadge status={row.original.status} />,
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteDebitNotes(numericIds);
    };

    const handleExport = async () => {
        const res = await exportDebitNotes();
        if (!res.success) throw new Error(res.error);
        saveFileDownload(res.data);
    };

    const handleDownloadTemplate = async () => {
        const res = await downloadDebitNoteImportTemplate();
        if (!res.success) throw new Error(res.error);
        saveFileDownload(res.data);
    };

    const handleImport = async (file: File) => {
        const res = await importDebitNotes(file);
        return res.success
            ? { success: true, message: res.message }
            : { success: false, message: res.error, errors: res.errors };
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<DebitNoteResource, any>
                    title={t("routes.debit_notes") || "Debit Notes"}
                    fetchAction={getDebitNotes}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_debit_note") || "Add Debit Note"}
                    importable
                    exportable
                    onExport={handleExport}
                    onDownloadTemplate={handleDownloadTemplate}
                    onImport={handleImport}
                />
            </CardContent>
        </Card>
    );
}

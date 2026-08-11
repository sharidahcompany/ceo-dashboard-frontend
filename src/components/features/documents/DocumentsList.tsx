"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { FileSignature } from "lucide-react";

import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCan } from "@/providers/AbilityProvider";
import {
    deleteDocuments,
    getDocuments,
    DocumentResource,
} from "@/actions/workspace/documents.actions";

/** Maps a document status onto a badge tone. */
function statusVariant(value?: string) {
    switch (value) {
        case "completed":
            return "default" as const;
        case "voided":
        case "declined":
        case "expired":
            return "destructive" as const;
        case "pending_internal":
        case "pending_external":
            return "secondary" as const;
        default:
            return "outline" as const;
    }
}

export default function DocumentsList() {
    const t = useTranslations();
    const canCreate = useCan("workspace.document.create");
    const canEdit = useCan("workspace.document.update");
    const canDelete = useCan("workspace.document.delete");

    const columns = useMemo<ColumnDef<DocumentResource>[]>(
        () => [
            {
                accessorKey: "title",
                header: t("attributes.title"),
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.title}</span>
                ),
            },
            {
                accessorKey: "status",
                header: t("attributes.status"),
                cell: ({ row }) => (
                    <Badge variant={statusVariant(row.original.status?.value)}>
                        {row.original.status?.label || row.original.status?.value}
                    </Badge>
                ),
            },
            {
                id: "waiting_on",
                header: t("messages.documents.waiting_on"),
                cell: ({ row }) => {
                    const doc = row.original;
                    if (!doc.is_pending) return <span className="text-muted-foreground">-</span>;

                    const waiting = (doc.signers ?? []).filter(
                        (s) => s.order === doc.current_step && s.status.value !== "signed",
                    );

                    return waiting.length > 0 ? (
                        <span>{waiting.map((s) => s.name).join(", ")}</span>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
            {
                accessorKey: "signers_count",
                header: t("attributes.signers"),
                cell: ({ row }) => row.original.signers_count ?? 0,
            },
            {
                accessorKey: "completed_at",
                header: t("attributes.signed_at"),
                cell: ({ row }) =>
                    row.original.completed_at ? (
                        <span dir="ltr">{row.original.completed_at.substring(0, 10)}</span>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    ),
            },
        ],
        [t],
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteDocuments(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<DocumentResource, any>
                    title={t("routes.issued_documents")}
                    description={t("messages.documents.description")}
                    fetchAction={(query) =>
                        getDocuments(query ? `${query}&include=signers` : "include=signers")
                    }
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={canCreate ? t("messages.documents.create_new") : undefined}
                    createIcon={FileSignature}
                    editable={canEdit}
                    deletable={canDelete}
                />
            </CardContent>
        </Card>
    );
}

"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDocuments, downloadDocumentPdf, DocumentResource } from "@/actions/workspace/documents.actions";

interface EmployeeContractsProps {
    employeeId: string;
}

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

export default function EmployeeContracts({ employeeId }: EmployeeContractsProps) {
    const t = useTranslations();

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

    const handleDownloadPdf = async (doc: DocumentResource) => {
        const res = await downloadDocumentPdf(doc.id);
        if (!res.success) {
            toast.error(res.error);
            return;
        }

        const blob = await fetch(`data:${res.data.content_type};base64,${res.data.base64}`).then((r) =>
            r.blob(),
        );
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = url;
        link.download = res.data.filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Card className="w-full">
            <CardHeader className="border-b">
                <CardTitle>{t("attributes.contracts")}</CardTitle>
                <CardDescription>{t("messages.employees.contracts_description")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <DataGrid<DocumentResource, any>
                    fetchAction={(query) =>
                        getDocuments(
                            query
                                ? `${query}&filter[signers.user_id]=${employeeId}`
                                : `filter[signers.user_id]=${employeeId}`,
                        )
                    }
                    columns={columns}
                    idKey="id"
                    editable={false}
                    deletable={false}
                    hasPdf
                    onDownloadPdf={handleDownloadPdf}
                />
            </CardContent>
        </Card>
    );
}

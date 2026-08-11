"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";

import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCan } from "@/providers/AbilityProvider";
import {
    deleteDocumentTemplates,
    getDocumentTemplates,
    DocumentTemplateResource,
} from "@/actions/workspace/document-templates.actions";

export default function DocumentTemplatesList() {
    const t = useTranslations();
    const canCreate = useCan("workspace.document_template.create");
    const canEdit = useCan("workspace.document_template.update");
    const canDelete = useCan("workspace.document_template.delete");

    const columns = useMemo<ColumnDef<DocumentTemplateResource>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("attributes.name"),
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.name}</span>
                ),
            },
            {
                accessorKey: "category",
                header: t("attributes.category"),
                cell: ({ row }) =>
                    row.original.category ? (
                        <Badge variant="outline">{row.original.category}</Badge>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    ),
            },
            {
                accessorKey: "status",
                header: t("attributes.status"),
                cell: ({ row }) => {
                    const status = row.original.status;
                    const variant =
                        status?.value === "active"
                            ? "default"
                            : status?.value === "archived"
                              ? "destructive"
                              : "outline";
                    return <Badge variant={variant}>{status?.label || status?.value}</Badge>;
                },
            },
            {
                id: "fields_count",
                header: t("messages.document_templates.fields_detected"),
                cell: ({ row }) => row.original.fields_count ?? 0,
            },
            {
                id: "anchors_count",
                header: t("messages.document_templates.anchors_detected"),
                cell: ({ row }) => row.original.anchors_count ?? 0,
            },
            {
                accessorKey: "version",
                header: t("attributes.version"),
                cell: ({ row }) => <span dir="ltr">v{row.original.version}</span>,
            },
        ],
        [t],
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteDocumentTemplates(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<DocumentTemplateResource, any>
                    title={t("routes.document_templates")}
                    description={t("messages.document_templates.description")}
                    fetchAction={getDocumentTemplates}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={
                        canCreate ? t("messages.document_templates.create_new") : undefined
                    }
                    createIcon={FileText}
                    editable={canEdit}
                    deletable={canDelete}
                />
            </CardContent>
        </Card>
    );
}

"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOutgoingRequests, AuditRequestResource } from "@/actions/auditor/auditor.actions";

export default function OutgoingRequestsList() {
    const t = useTranslations("auditor");
    const locale = useLocale();

    const columns: ColumnDef<AuditRequestResource>[] = [
        {
            accessorKey: "receiver.name",
            header: t("companies"),
            cell: ({ row }) => {
                const receiver = row.original.receiver;
                let name = "";
                if (receiver) {
                    if (typeof receiver.name === "object") {
                        const nameObj = receiver.name as any;
                        name = nameObj[locale] || nameObj.en || nameObj.ar || "";
                    } else {
                        name = String(receiver.name || "");
                    }
                } else if (row.original.to_name) {
                    const nameObj = row.original.to_name as any;
                    name = nameObj[locale] || nameObj.en || nameObj.ar || "";
                }

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                            <AvatarImage src={receiver?.logo} alt={name} />
                            <AvatarFallback className="text-xs">{name.charAt(0) || "C"}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                            {name || `Tenant #${row.original.to}`}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: t("status"),
            cell: ({ row }) => {
                const status = row.original.status;
                const variants: Record<string, "default" | "secondary" | "destructive"> = {
                    accepted: "default",
                    approved: "default",
                    pending: "secondary",
                    rejected: "destructive",
                };
                return (
                    <Badge variant={variants[status] || "secondary"}>
                        {t(status)}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: t("date"),
            cell: ({ row }) => {
                if (!row.original.created_at) return "-";
                return new Date(row.original.created_at).toLocaleDateString();
            },
        },
    ];

    return (
        <DataGrid<AuditRequestResource, any>
            fetchAction={getOutgoingRequests}
            columns={columns}
            editable={false}
            deletable={false}
            idKey="id"
        />
    );
}

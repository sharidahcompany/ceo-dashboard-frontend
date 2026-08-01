"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getIncomingRequests, acceptRequest, rejectRequest, AuditRequestResource } from "@/actions/auditor/auditor.actions";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocale } from "next-intl";

export default function IncomingRequestsList() {
    const t = useTranslations("auditor");
    const locale = useLocale();
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAccept = async (id: number) => {
        try {
            const res = await acceptRequest(id);
            if (res.success) {
                toast.success(t("success_accept"));
                setRefreshKey((prev) => prev + 1);
            } else {
                toast.error(res.error || "Failed to accept request");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleReject = async (id: number) => {
        try {
            const res = await rejectRequest(id);
            if (res.success) {
                toast.success(t("success_reject"));
                setRefreshKey((prev) => prev + 1);
            } else {
                toast.error(res.error || "Failed to reject request");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const columns: ColumnDef<AuditRequestResource>[] = [
        {
            accessorKey: "sender.name",
            header: t("companies"),
            cell: ({ row }) => {
                const sender = row.original.sender;
                let name = "";
                if (sender) {
                    if (typeof sender.name === "object") {
                        const nameObj = sender.name as any;
                        name = nameObj[locale] || nameObj.en || nameObj.ar || "";
                    } else {
                        name = String(sender.name || "");
                    }
                } else if (row.original.from_name) {
                    const nameObj = row.original.from_name as any;
                    name = nameObj[locale] || nameObj.en || nameObj.ar || "";
                }

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                            <AvatarImage src={sender?.logo} alt={name} />
                            <AvatarFallback className="text-xs">{name.charAt(0) || "C"}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                            {name || `Tenant #${row.original.from}`}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "applied_by",
            header: t("applier"),
            cell: ({ row }) => {
                const applier = row.original.applier;
                const name = applier 
                    ? `${applier.first_name} ${applier.last_name}` 
                    : row.original.applied_by;

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                            <AvatarImage src={applier?.avatar_url} alt={name} />
                            <AvatarFallback className="text-xs">{name.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                            {name}
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
        {
            id: "actions",
            header: t("actions"),
            cell: ({ row }) => {
                if (row.original.status !== "pending") return null;
                return (
                    <div className="flex items-center gap-1.5 justify-center">
                        <Button size="xs" onClick={() => handleAccept(row.original.id)}>
                            <Check className="size-3.5 mr-1" />
                            {t("accept")}
                        </Button>
                        <Button size="xs" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => handleReject(row.original.id)}>
                            <X className="size-3.5 mr-1" />
                            {t("reject")}
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <DataGrid<AuditRequestResource, any>
            key={refreshKey}
            fetchAction={getIncomingRequests}
            columns={columns}
            editable={false}
            deletable={false}
            idKey="id"
        />
    );
}

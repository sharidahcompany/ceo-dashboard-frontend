"use client";

import React, { useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Button } from "@/components/ui/button";
import { getTenants, requestAccess, TenantResource } from "@/actions/auditor/auditor.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Send } from "lucide-react";

export default function CompaniesList() {
    const t = useTranslations("auditor");
    const locale = useLocale();
    const [isPending, startTransition] = useTransition();

    const getTenantName = (tenant: TenantResource) => {
        if (!tenant.name) return "";
        if (typeof tenant.name === "object") {
            const nameObj = tenant.name as any;
            return nameObj[locale] || nameObj.en || nameObj.ar || "";
        }
        return String(tenant.name);
    };

    const handleSendRequest = (tenant: TenantResource) => {
        startTransition(async () => {
            const res = await requestAccess({ to: tenant.id });
            if (res.success) {
                toast.success(t("success_sent"));
            } else {
                toast.error(res.error || "Failed to send audit request");
            }
        });
    };

    const columns: ColumnDef<TenantResource>[] = [
        {
            accessorKey: "name",
            header: t("name"),
            cell: ({ row }) => {
                const name = getTenantName(row.original);
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                            <AvatarImage src={row.original.logo} alt={name} />
                            <AvatarFallback className="text-xs">{name.charAt(0) || "C"}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{name}</span>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: t("actions"),
            cell: ({ row }) => (
                <div className="flex items-center justify-start">
                    <Button 
                        size="xs" 
                        disabled={isPending} 
                        onClick={() => handleSendRequest(row.original)}
                    >
                        <Send className="size-3.5 mr-1" />
                        {t("request_access")}
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DataGrid<TenantResource, any>
            fetchAction={getTenants}
            columns={columns}
            editable={false}
            deletable={false}
            idKey="id"
        />
    );
}

"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PermissionGate } from "@/components/shared/PermissionGate";
import {
    getSubscribers,
    SubscriberResource,
} from "@/actions/website/subscribers.actions";

function tenantName(subscriber: SubscriberResource): string {
    if (subscriber.name_localized) return subscriber.name_localized;
    if (typeof subscriber.name === "string") return subscriber.name;
    return subscriber.name?.en || subscriber.name?.ar || "-";
}

export default function SubscribersPage() {
    const t = useTranslations();
    const locale = useLocale();

    const columns = useMemo<ColumnDef<SubscriberResource>[]>(
        () => [
            {
                accessorKey: "name",
                header: t("attributes.tenant"),
                cell: ({ row }) => {
                    const name = tenantName(row.original);
                    return (
                        <div className="flex items-center gap-2">
                            <Avatar className="size-7">
                                {row.original.logo_url && (
                                    <AvatarImage src={row.original.logo_url} alt={name} />
                                )}
                                <AvatarFallback>
                                    <Building2 className="size-4 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span>{name}</span>
                                {row.original.email && (
                                    <span className="text-xs text-muted-foreground">
                                        {row.original.email}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "owner",
                header: t("attributes.owner"),
                cell: ({ row }) => {
                    const owner = row.original.owner;
                    if (!owner) return "-";
                    return (
                        <div className="flex flex-col">
                            <span>{owner.name || "-"}</span>
                            {owner.email && (
                                <span className="text-xs text-muted-foreground">
                                    {owner.email}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "created_at",
                header: t("attributes.created_at"),
                cell: ({ row }) => {
                    if (!row.original.created_at) return "-";
                    const date = new Date(row.original.created_at);
                    return Number.isNaN(date.getTime())
                        ? "-"
                        : date.toLocaleDateString(locale);
                },
            },
        ],
        [t, locale]
    );

    return (
        <PermissionGate superAdminOnly>
            <Card>
                <CardContent>
                    <DataGrid<SubscriberResource, any>
                        title={t("routes.subscribers")}
                        description={t("messages.website.subscribers_description")}
                        fetchAction={getSubscribers}
                        columns={columns}
                        idKey="id"
                        editable={false}
                        deletable={false}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

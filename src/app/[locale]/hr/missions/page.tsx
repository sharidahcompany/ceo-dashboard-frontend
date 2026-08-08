"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    getMissions,
    deleteMissions,
    MissionResource,
} from "@/actions/workspace/missions.actions";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { useCan } from "@/providers/AbilityProvider";

export default function MissionsPage() {
    const t = useTranslations();
    const canCreate = useCan("workspace.mission.create");
    const canEdit = useCan("workspace.mission.update");
    const canDelete = useCan("workspace.mission.delete");

    const columns = useMemo<ColumnDef<MissionResource>[]>(
        () => [
            {
                accessorKey: "title",
                header: t("attributes.title") || "Title",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.title}</span>
                ),
            },
            {
                accessorKey: "assignees",
                header: t("attributes.assignees") || "Assignees",
                cell: ({ row }) => {
                    const assignees = row.original.assignees ?? [];
                    if (assignees.length === 0) return <span className="text-muted-foreground">-</span>;
                    return (
                        <TooltipProvider delay={200}>
                            <div className="flex items-center -space-x-2">
                                {assignees.slice(0, 4).map((u) => {
                                    const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || "";
                                    return (
                                        <Tooltip key={String(u.id)}>
                                            <TooltipTrigger>
                                                <Avatar className="h-7 w-7 border-2 border-background cursor-pointer">
                                                    {u.avatar && <AvatarImage src={u.avatar} alt={name} />}
                                                    <AvatarFallback className="bg-muted text-[10px]">
                                                        <User className="h-3 w-3 text-muted-foreground" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p>{name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                                {assignees.length > 4 && (
                                    <span className="ms-3 text-xs text-muted-foreground">
                                        +{assignees.length - 4}
                                    </span>
                                )}
                            </div>
                        </TooltipProvider>
                    );
                },
            },
            {
                accessorKey: "start_datetime",
                header: t("attributes.start_datetime") || "Start",
                cell: ({ row }) => {
                    const val = row.original.start_datetime;
                    return val ? String(val).substring(0, 16).replace("T", " ") : "-";
                },
            },
            {
                accessorKey: "end_datetime",
                header: t("attributes.end_datetime") || "End",
                cell: ({ row }) => {
                    const val = row.original.end_datetime;
                    return val ? String(val).substring(0, 16).replace("T", " ") : "-";
                },
            },
            {
                accessorKey: "expense_amount",
                header: t("attributes.expense_amount") || "Expense",
                cell: ({ row }) => {
                    const val = row.original.expense_amount;
                    return val ? `${Number(val).toFixed(2)}` : "-";
                },
            },
            {
                accessorKey: "status",
                header: t("attributes.status") || "Status",
                cell: ({ row }) => {
                    const status = row.original.status;
                    const value = status?.value;
                    const label = status?.label || value;
                    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
                    if (value === "in_progress") variant = "default";
                    if (value === "completed") variant = "secondary";
                    if (value === "cancelled") variant = "destructive";
                    return <Badge variant={variant}>{label}</Badge>;
                },
            },
            {
                accessorKey: "approval_status",
                header: t("attributes.approval_status") || "Approval",
                cell: ({ row }) => {
                    const approval = row.original.approval_status;
                    const value = approval?.value;
                    const label = approval?.label || value;
                    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
                    if (value === "approved") variant = "default";
                    if (value === "rejected") variant = "destructive";
                    return <Badge variant={variant}>{label}</Badge>;
                },
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteMissions(numericIds);
    };

    return (
        <PermissionGate permission="workspace.mission.view">
            <Card>
                <CardContent>
                    <DataGrid<MissionResource, any>
                        title={t("routes.missions") || "Missions"}
                        description={t("messages.hr.missions_description") || "Manage and track employee missions"}
                        fetchAction={getMissions}
                        deleteAction={handleDelete}
                        columns={columns}
                        idKey="id"
                        createTitle={canCreate ? (t("messages.hr.create_new_mission") || "Create Mission") : undefined}
                        editable={canEdit}
                        deletable={canDelete}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

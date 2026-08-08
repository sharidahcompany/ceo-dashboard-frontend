"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Check, X } from "lucide-react";
import {
    getAttendancePermissions,
    deleteAttendancePermissions,
    AttendancePermissionResource,
} from "@/actions/workspace/attendance-permissions.actions";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { useCan } from "@/providers/AbilityProvider";

export default function AttendancePermissionsPage() {
    const t = useTranslations();
    const canCreate = useCan("workspace.attendance_permission.create");
    const canEdit = useCan("workspace.attendance_permission.update");
    const canDelete = useCan("workspace.attendance_permission.delete");

    const columns = useMemo<ColumnDef<AttendancePermissionResource>[]>(
        () => [
            {
                accessorKey: "user",
                header: t("routes.employees") || "Employee",
                cell: ({ row }) => {
                    const u = row.original.user;
                    if (!u) return <span className="text-muted-foreground">-</span>;
                    const fullName =
                        `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || "-";
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                {u.avatar && <AvatarImage src={u.avatar} alt={fullName} />}
                                <AvatarFallback className="bg-muted">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{fullName}</span>
                        </div>
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
                accessorKey: "reason",
                header: t("attributes.reason") || "Reason",
                cell: ({ row }) => {
                    const reason = row.original.reason;
                    if (!reason) return <span className="text-muted-foreground">-</span>;
                    return (
                        <span className="line-clamp-2 max-w-[200px] text-sm">{reason}</span>
                    );
                },
            },
            {
                accessorKey: "deduct_from_balance",
                header: t("attributes.deduct_from_balance") || "Deduct",
                cell: ({ row }) => {
                    const val = row.original.deduct_from_balance;
                    return val ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                    );
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
        return deleteAttendancePermissions(numericIds);
    };

    return (
        <PermissionGate permission="workspace.attendance_permission.view">
            <Card>
                <CardContent>
                    <DataGrid<AttendancePermissionResource, any>
                        title={t("routes.attendance_permissions") || "Attendance Permissions"}
                        description={
                            t("messages.hr.attendance_permissions_description") ||
                            "Manage employee attendance leave and late permission requests"
                        }
                        fetchAction={getAttendancePermissions}
                        deleteAction={handleDelete}
                        columns={columns}
                        idKey="id"
                        createTitle={
                            canCreate ? (t("routes.create_attendance_permission") || "Create Permission") : undefined
                        }
                        editable={canEdit}
                        deletable={canDelete}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

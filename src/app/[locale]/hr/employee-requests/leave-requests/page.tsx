"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Check, X } from "lucide-react";
import { getLeaveRequests } from "@/actions/workspace/employees-requests.actions";
import {
    deleteAttendancePermissions,
    updateAttendancePermission,
    AttendancePermissionResource,
} from "@/actions/workspace/attendance-permissions.actions";
import { EditableStatusSelect } from "@/components/features/hr/EditableStatusSelect";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function LeaveRequestsPage() {
    const t = useTranslations();

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
                    const options = [
                        { value: "pending", label: t("attributes.pending") || "Pending", variant: "secondary" as const },
                        { value: "approved", label: t("attributes.approved") || "Approved", variant: "default" as const },
                        { value: "rejected", label: t("attributes.rejected") || "Rejected", variant: "destructive" as const },
                    ];
                    return (
                        <EditableStatusSelect
                            value={status?.value || ""}
                            options={options}
                            onChange={(newValue) =>
                                updateAttendancePermission(row.original.id, { status: newValue })
                            }
                        />
                    );
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
                        title={t("routes.leave_requests") || "Leave Requests"}
                        description={
                            t("messages.hr.attendance_permissions_description") ||
                            "Manage employee attendance leave and late permission requests"
                        }
                        fetchAction={getLeaveRequests}
                        deleteAction={handleDelete}
                        columns={columns}
                        idKey="id"
                        editable={false}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

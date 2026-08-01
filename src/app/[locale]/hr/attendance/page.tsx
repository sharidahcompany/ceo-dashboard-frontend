"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { getAttendances, deleteAttendances, AttendanceResource } from "@/actions/workspace/attendance.actions";

export default function AttendancePage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<AttendanceResource>[]>(
        () => [
            {
                accessorKey: "user",
                header: t("routes.employees") || "Employee",
                cell: ({ row }) => {
                    const u = row.original.user;
                    if (!u) return "-";
                    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || "-";
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
                accessorKey: "attendance_date",
                header: t("attributes.date") || "Date",
                cell: ({ row }) => {
                    const date = row.original.attendance_date;
                    return date ? date.substring(0, 10) : "-";
                },
            },
            {
                accessorKey: "check_in",
                header: t("attributes.check_in") || "Check In",
                cell: ({ row }) => {
                    const checkIn = row.original.check_in;
                    if (!checkIn) return "-";
                    const match = checkIn.match(/(\d{2}):(\d{2})/);
                    return match ? `${match[1]}:${match[2]}` : checkIn;
                },
            },
            {
                accessorKey: "check_out",
                header: t("attributes.check_out") || "Check Out",
                cell: ({ row }) => {
                    const checkOut = row.original.check_out;
                    if (!checkOut) return "-";
                    const match = checkOut.match(/(\d{2}):(\d{2})/);
                    return match ? `${match[1]}:${match[2]}` : checkOut;
                },
            },
            {
                accessorKey: "late_minutes",
                header: t("attributes.late_minutes") || "Late (Mins)",
                cell: ({ row }) => {
                    const val = row.original.late_minutes;
                    return val !== undefined && val !== null ? `${val} ${t("attributes.minutes") || "mins"}` : "-";
                },
            },
            {
                accessorKey: "overtime_minutes",
                header: t("attributes.overtime_minutes") || "Overtime (Mins)",
                cell: ({ row }) => {
                    const val = row.original.overtime_minutes;
                    return val !== undefined && val !== null ? `${val} ${t("attributes.minutes") || "mins"}` : "-";
                },
            },
            {
                accessorKey: "status",
                header: t("attributes.status") || "Status",
                cell: ({ row }) => {
                    const status = row.original.status;
                    const label = row.original.status_label || status;
                    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
                    if (status === "present") variant = "default";
                    if (status === "late") variant = "secondary";
                    if (status === "absent") variant = "destructive";
                    return (
                        <Badge variant={variant}>
                            {label}
                        </Badge>
                    );
                },
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
        return deleteAttendances(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<AttendanceResource, any>
                    title={t("routes.attendance") || "Attendance"}
                    description={t("messages.hr.attendance_description") || "Manage and review organization employee attendance logs"}
                    fetchAction={getAttendances}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("messages.hr.record_attendance") || "Record Attendance"}
                />
            </CardContent>
        </Card>
    );
}

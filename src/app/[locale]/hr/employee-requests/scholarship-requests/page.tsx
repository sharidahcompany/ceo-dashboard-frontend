"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { getScholarshipRequests } from "@/actions/workspace/employees-requests.actions";
import {
    deleteScholarshipRequests,
    updateScholarshipRequestStatus,
    ScholarshipRequestResource,
} from "@/actions/workspace/scholarships.actions";
import { EditableStatusSelect } from "@/components/features/hr/EditableStatusSelect";

export default function ScholarshipRequestsPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<ScholarshipRequestResource>[]>(
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
                accessorKey: "title",
                header: t("attributes.title") || "Title",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.title}</span>
                ),
            },
            {
                accessorKey: "price",
                header: t("attributes.price") || "Price",
                cell: ({ row }) => {
                    const price = row.original.price;
                    return price !== undefined ? `${Number(price).toFixed(2)}` : "-";
                },
            },
            {
                accessorKey: "discount_percentage",
                header: t("attributes.discount_percentage") || "Discount",
                cell: ({ row }) => {
                    const pct = row.original.discount_percentage;
                    return pct !== undefined ? `${pct}%` : "-";
                },
            },
            {
                accessorKey: "final_price",
                header: t("attributes.final_price") || "Final Price",
                cell: ({ row }) => {
                    const final = row.original.final_price;
                    return final !== undefined ? `${Number(final).toFixed(2)}` : "-";
                },
            },
            {
                accessorKey: "duration",
                header: t("attributes.duration") || "Duration",
                cell: ({ row }) => row.original.duration || "-",
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
                            value={status || ""}
                            options={options}
                            onChange={(newValue) =>
                                updateScholarshipRequestStatus(
                                    row.original.id,
                                    newValue as "pending" | "approved" | "rejected"
                                )
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
        return deleteScholarshipRequests(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<ScholarshipRequestResource, any>
                    title={t("routes.scholarship_requests") || "Scholarship Requests"}
                    description={t("messages.hr.scholarship_requests_description") || "Manage employee scholarship applications, approvals, and records"}
                    fetchAction={getScholarshipRequests}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    editable={false}
                />
            </CardContent>
        </Card>
    );
}

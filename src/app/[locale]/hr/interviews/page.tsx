"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getInterviews, deleteInterviews, JobInterviewResource } from "@/actions/workspace/interviews.actions";

export default function InterviewsPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<JobInterviewResource>[]>(
        () => [
            {
                accessorKey: "user",
                header: t("routes.candidates"),
                cell: ({ row }) => {
                    console.log("Interview Row:", row.original);
                    const u = row.original.user;
                    if (!u) return "-";
                    return u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "-";
                },
            },
            {
                accessorKey: "interviewers",
                header: t("routes.employees") || "Interviewers",
                cell: ({ row }) => {
                    const list = row.original.interviewers;
                    if (!list || list.length === 0) return "-";
                    return (
                        <div className="flex flex-wrap gap-1">
                            {list.map(i => (
                                <Badge key={i.id} variant="secondary">
                                    {i.full_name}
                                </Badge>
                            ))}
                        </div>
                    );
                },
            },
            {
                accessorKey: "scheduled_at",
                header: t("attributes.scheduled_at"),
                cell: ({ row }) => row.original.scheduled_at || "-",
            },
            {
                accessorKey: "interview_type",
                header: t("attributes.interview_type"),
                cell: ({ row }) => row.original.interview_type ? t(`attributes.${row.original.interview_type}`) : "-",
            },
            {
                accessorKey: "status",
                header: t("attributes.status"),
                cell: ({ row }) => (
                    <Badge variant="outline">
                        {row.original.status ? t(`attributes.${row.original.status}`) : "-"}
                    </Badge>
                ),
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
        return deleteInterviews(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<JobInterviewResource, any>
                    title={t("routes.interviews")}
                    description={t("messages.hr.positions_description") || "Manage organization job interviews"}
                    fetchAction={getInterviews}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("messages.hr.create_new_interview")}
                />
            </CardContent>
        </Card>
    );
}

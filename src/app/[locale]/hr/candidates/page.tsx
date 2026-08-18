"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import {
    getCandidates,
    deleteCandidates,
    updateCandidateStatus,
    JobApplicationResource,
} from "@/actions/workspace/candidates.actions";
import { EditableStatusSelect } from "@/components/features/hr/EditableStatusSelect";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { useCan } from "@/providers/AbilityProvider";
import { Link } from "@/i18n/navigation";

export default function CandidatesPage() {
    const t = useTranslations();
    const canCreate = useCan("workspace.job_application.create");
    const canEdit = useCan("workspace.job_application.update");
    const canDelete = useCan("workspace.job_application.delete");

    const columns = useMemo<ColumnDef<JobApplicationResource>[]>(
        () => [
            {
                accessorKey: "full_name",
                header: t("attributes.full_name"),
                cell: ({ row }) => row.original.full_name || "-",
            },
            {
                accessorKey: "email",
                header: t("attributes.email"),
                cell: ({ row }) => row.original.email || "-",
            },
            {
                accessorKey: "phone",
                header: t("attributes.phone"),
                cell: ({ row }) => row.original.phone || "-",
            },
            {
                accessorKey: "vacancy",
                header: t("attributes.vacancy"),
                cell: ({ row }) => row.original.vacancy?.title || "-",
            },
            {
                accessorKey: "cv",
                header: t("attributes.cv"),
                cell: ({ row }) => {
                    const cv = row.original.cv;
                    if (!cv) return "-";
                    return (
                        <a href={cv} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                            {t("attributes.cv")}
                        </a>
                    );
                },
            },
            {
                accessorKey: "status",
                header: t("attributes.status"),
                cell: ({ row }) => {
                    const status = row.original.status;
                    const options = [
                        { value: "pending", label: t("attributes.pending"), variant: "secondary" as const },
                        { value: "accepted", label: t("attributes.accepted"), variant: "default" as const },
                        { value: "rejected", label: t("attributes.rejected"), variant: "destructive" as const },
                    ];
                    return (
                        <EditableStatusSelect
                            value={status || ""}
                            options={options}
                            onChange={(newValue) => updateCandidateStatus(row.original.id, newValue)}
                        />
                    );
                },
            },
            {
                id: "convert",
                header: "",
                // Real eligibility (an accepted job offer) is enforced server-side
                // on the convert page itself; "accepted" here is just enough to
                // avoid showing the action on candidates who obviously aren't ready.
                cell: ({ row }) =>
                    row.original.status === "accepted" ? (
                        <Link href={`/hr/candidates/${row.original.id}/convert`}>
                            <Button type="button" size="sm" variant="outline" className="gap-2">
                                <UserPlus className="size-4" />
                                {t("routes.convert_to_employee") || "Convert to Employee"}
                            </Button>
                        </Link>
                    ) : null,
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteCandidates(numericIds);
    };

    return (
        <PermissionGate permission="workspace.job_application.view">
            <Card>
                <CardContent>
                    <DataGrid<JobApplicationResource, any>
                        title={t("routes.candidates")}
                        description={t("messages.hr.candidates_description")}
                        fetchAction={getCandidates}
                        deleteAction={handleDelete}
                        columns={columns}
                        idKey="id"
                        createTitle={canCreate ? t("messages.hr.create_new_candidate") : undefined}
                        editable={canEdit}
                        deletable={canDelete}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

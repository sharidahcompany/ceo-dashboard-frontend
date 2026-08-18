"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { getJobOffers, deleteJobOffers, resendJobOffer, JobOfferResource } from "@/actions/workspace/job-offers.actions";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { Link } from "@/i18n/navigation";
import { useCan } from "@/providers/AbilityProvider";

export default function JobOffersPage() {
    const t = useTranslations();
    const canCreate = useCan("workspace.job_offer.create");
    const canEdit = useCan("workspace.job_offer.update");
    const canDelete = useCan("workspace.job_offer.delete");

    const handleResend = async (id: number) => {
        const res = await resendJobOffer(id);
        if (res.success) {
            toast.success(res.message || t("success"));
        } else {
            toast.error(res.error);
        }
    };

    const columns = useMemo<ColumnDef<JobOfferResource>[]>(
        () => [
            {
                accessorKey: "user",
                header: t("attributes.candidate") || "Candidate",
                cell: ({ row }) => {
                    const user = row.original.user as any;
                    if (!user) return "-";
                    return user.full_name || `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email || "-";
                },
            },
            {
                accessorKey: "position",
                header: t("routes.positions"),
                cell: ({ row }) => (row.original.position as any)?.name_localized || (row.original.position as any)?.name?.en || "-",
            },
            {
                accessorKey: "salary",
                header: t("attributes.salary") || "Salary",
                cell: ({ row }) => row.original.salary || "-",
            },
            {
                accessorKey: "start_date",
                header: t("attributes.start_date") || "Start Date",
                cell: ({ row }) => row.original.start_date || "-",
            },
            {
                accessorKey: "status",
                header: t("attributes.status") || "Status",
                cell: ({ row }) => <Badge variant="outline">{row.original.status?.label}</Badge>,
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => {
                    const status = row.original.status?.value;
                    return (
                        <div className="flex gap-2">
                            <Link href={`/hr/job-offers/${row.original.id}`}>
                                <Button type="button" size="sm" variant="outline" className="gap-2">
                                    <Eye className="size-4" />
                                    {status === "draft" ? t("buttons.send") || "Send" : t("buttons.view") || "View"}
                                </Button>
                            </Link>
                            {status === "sent" && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => handleResend(row.original.id)}
                                >
                                    <RotateCw className="size-4" />
                                    {t("buttons.resend") || "Resend"}
                                </Button>
                            )}
                        </div>
                    );
                },
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
        return deleteJobOffers(numericIds);
    };

    return (
        <PermissionGate permission="workspace.job_offer.view">
            <Card>
                <CardContent>
                    <DataGrid<JobOfferResource, any>
                        title={t("routes.job_offer")}
                        description={t("messages.hr.job_offers_description") || "Manage job offers sent to candidates"}
                        fetchAction={getJobOffers}
                        deleteAction={handleDelete}
                        columns={columns}
                        idKey="id"
                        createTitle={canCreate ? t("buttons.create") : undefined}
                        editable={canEdit}
                        deletable={canDelete}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

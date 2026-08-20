"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { BadgeCheck, Check, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import {
    approveVerificationRequest,
    getVerificationRequests,
    rejectVerificationRequest,
    VerificationRequestResource,
    VerificationStatus,
} from "@/actions/website/verification.actions";

const STATUS_VARIANTS: Record<VerificationStatus, "default" | "secondary" | "destructive"> = {
    pending: "secondary",
    approved: "default",
    rejected: "destructive",
};

export default function VerificationRequestsList() {
    const t = useTranslations("verification");
    const [requests, setRequests] = useState<VerificationRequestResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        const res = await getVerificationRequests();
        if (res.success) {
            setRequests(res.data.data);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = (id: string | number) => {
        startTransition(async () => {
            const res = await approveVerificationRequest(id);
            if (res.success) {
                toast.success(t("approved", { defaultValue: "Request approved" }));
                fetchRequests();
            } else {
                toast.error(res.error);
            }
        });
    };

    const handleReject = (id: string | number) => {
        const reason = window.prompt(t("rejection_reason")) || undefined;
        startTransition(async () => {
            const res = await rejectVerificationRequest(id, reason);
            if (res.success) {
                toast.success(t("rejected", { defaultValue: "Request rejected" }));
                fetchRequests();
            } else {
                toast.error(res.error);
            }
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <BadgeCheck className="h-4 w-4" />
                    </EmptyMedia>
                    <EmptyTitle>{t("empty", { defaultValue: "No verification requests" })}</EmptyTitle>
                    <EmptyDescription>
                        {t("empty_description", {
                            defaultValue: "New requests submitted by tenants will show up here.",
                        })}
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t("tenant", { defaultValue: "Tenant" })}</TableHead>
                    <TableHead>{t("id_image")}</TableHead>
                    <TableHead>{t("commercial_number")}</TableHead>
                    <TableHead>{t("tax_number")}</TableHead>
                    <TableHead>{t("status.pending")}</TableHead>
                    <TableHead>{t("received", { defaultValue: "Received" })}</TableHead>
                    <TableHead />
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.map((request) => (
                    <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.tenant?.name ?? "-"}</TableCell>
                        <TableCell>
                            {request.id_image_url ? (
                                <a
                                    href={request.id_image_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {t("view_image", { defaultValue: "View" })}
                                </a>
                            ) : (
                                "-"
                            )}
                        </TableCell>
                        <TableCell>{request.commercial_number}</TableCell>
                        <TableCell>{request.tax_number}</TableCell>
                        <TableCell>
                            <Badge variant={STATUS_VARIANTS[request.status]}>
                                {t(`status.${request.status}`)}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{request.created_at}</TableCell>
                        <TableCell className="text-end">
                            {request.status === "pending" && (
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isPending}
                                        onClick={() => handleApprove(request.id)}
                                    >
                                        <Check className="size-4 text-primary" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isPending}
                                        onClick={() => handleReject(request.id)}
                                    >
                                        <X className="size-4 text-destructive" />
                                    </Button>
                                </div>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

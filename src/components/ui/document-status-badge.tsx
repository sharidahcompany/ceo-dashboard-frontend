"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

const STATUS_VARIANTS: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    DRAFT: "outline",
    draft: "outline",
    APPROVED: "default",
    approved: "default",
    POSTED: "default",
    posted: "default",
    REGISTERED: "default",
    registered: "default",
    PAID: "default",
    paid: "default",
    SENT: "secondary",
    sent: "secondary",
    PARTIALLY_PAID: "secondary",
    partial: "secondary",
    unpaid: "outline",
    processed: "secondary",
};

export function DocumentStatusBadge({ status, label }: { status?: string | null; label?: string | null }) {
    const t = useTranslations();
    if (!status) return <span>-</span>;
    return (
        <Badge variant={STATUS_VARIANTS[status] || "outline"}>
            {label || t(`enums.documentStatus.${status}`)}
        </Badge>
    );
}

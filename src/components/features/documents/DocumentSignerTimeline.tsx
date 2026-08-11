"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Mail, PenLine, Stamp, X } from "lucide-react";
import { DocumentResource, DocumentSignerResource } from "@/actions/workspace/documents.actions";

function statusIcon(status: string) {
    switch (status) {
        case "signed":
            return <Check className="size-4 text-emerald-600" />;
        case "declined":
        case "expired":
            return <X className="size-4 text-destructive" />;
        case "notified":
        case "viewed":
            return <Mail className="size-4 text-muted-foreground" />;
        default:
            return <Clock className="size-4 text-muted-foreground" />;
    }
}

export interface DocumentSignerTimelineProps {
    document: DocumentResource;
    /** Rendered per signer — the "Sign now" control for whoever is up next. */
    renderAction?: (signer: DocumentSignerResource) => React.ReactNode;
}

/**
 * Signers grouped by step, in signing order, so it is obvious who the document
 * is currently waiting on.
 */
export default function DocumentSignerTimeline({
    document,
    renderAction,
}: DocumentSignerTimelineProps) {
    const t = useTranslations();
    const signers = document.signers ?? [];

    if (signers.length === 0) {
        return <p className="text-sm text-muted-foreground">{t("messages.documents.no_signers")}</p>;
    }

    const steps = Array.from(new Set(signers.map((s) => s.order))).sort((a, b) => a - b);

    return (
        <div className="space-y-5">
            {steps.map((step) => {
                const isCurrent = document.is_pending && step === document.current_step;

                return (
                    <div key={step} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant={isCurrent ? "default" : "secondary"}>
                                {t("messages.documents.step_n", { step })}
                            </Badge>
                            {isCurrent && (
                                <span className="text-sm text-muted-foreground">
                                    {t("messages.documents.current_step")}
                                </span>
                            )}
                        </div>

                        {signers
                            .filter((s) => s.order === step)
                            .map((signer) => (
                                <Card key={signer.id}>
                                    <CardContent className="flex flex-wrap items-center gap-3 py-4">
                                        {statusIcon(signer.status.value)}

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{signer.name}</span>
                                                <Badge variant="outline" className="gap-1">
                                                    {signer.role === "company" ? (
                                                        <Stamp className="size-3" />
                                                    ) : (
                                                        <PenLine className="size-3" />
                                                    )}
                                                    {signer.role}
                                                </Badge>
                                                <Badge variant="secondary">
                                                    {signer.party.label}
                                                </Badge>
                                            </div>
                                            {signer.email && (
                                                <span className="text-sm text-muted-foreground" dir="ltr">
                                                    {signer.email}
                                                </span>
                                            )}
                                            {signer.signed_at && (
                                                <span className="block text-sm text-muted-foreground">
                                                    {t("attributes.signed_at")}:{" "}
                                                    <span dir="ltr">
                                                        {signer.signed_at.replace("T", " ").substring(0, 16)}
                                                    </span>
                                                </span>
                                            )}
                                            {signer.decline_reason && (
                                                <span className="block text-sm text-destructive">
                                                    {signer.decline_reason}
                                                </span>
                                            )}
                                        </div>

                                        <Badge variant="outline">{signer.status.label}</Badge>

                                        {renderAction?.(signer)}
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                );
            })}
        </div>
    );
}

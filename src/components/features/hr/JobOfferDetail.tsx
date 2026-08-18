"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { ExternalLink, FileText, Loader2, Pencil, RotateCw, Send } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    getJobOffer,
    generateJobOfferDocument,
    sendJobOffer,
    resendJobOffer,
    JobOfferResource,
} from "@/actions/workspace/job-offers.actions";
import { previewDocument } from "@/actions/workspace/documents.actions";

export default function JobOfferDetail() {
    const t = useTranslations();
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [offer, setOffer] = useState<JobOfferResource | null>(null);
    const [html, setHtml] = useState("");
    const [isPending, startTransition] = useTransition();

    const load = useCallback(async () => {
        const res = await getJobOffer(id);
        if (!res.success) {
            toast.error(res.error);
            setLoading(false);
            return;
        }

        setOffer(res.data);

        if (res.data.document_id) {
            const previewRes = await previewDocument(res.data.document_id);
            if (previewRes.success) setHtml(previewRes.data.html);
        } else {
            setHtml("");
        }

        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const handleGenerate = () => {
        startTransition(async () => {
            const res = await generateJobOfferDocument(id);
            if (!res.success) {
                toast.error(res.error);
                return;
            }
            toast.success(res.message || t("success"));
            await load();
        });
    };

    const handleSend = () => {
        startTransition(async () => {
            const res = await sendJobOffer(id);
            if (!res.success) {
                toast.error(res.error);
                return;
            }
            toast.success(res.message || t("success"));
            await load();
        });
    };

    const handleResend = () => {
        startTransition(async () => {
            const res = await resendJobOffer(id);
            if (!res.success) {
                toast.error(res.error);
                return;
            }
            toast.success(res.message || t("success"));
            await load();
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!offer) {
        return null;
    }

    const candidate = offer.user as any;
    const candidateName =
        candidate?.full_name ||
        `${candidate?.first_name ?? ""} ${candidate?.last_name ?? ""}`.trim() ||
        candidate?.email ||
        "-";
    const status = offer.status?.value;
    const documentIsDraft = offer.document?.status?.value === "draft";

    return (
        <div className="space-y-5">
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <CardTitle className="flex flex-wrap items-center gap-2">
                                {t("routes.job_offer")} — {candidateName}
                                <Badge variant="outline">{offer.status?.label}</Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {(offer.position as any)?.name_localized ||
                                    (offer.position as any)?.name?.en ||
                                    "-"}
                                {" · "}
                                {offer.salary}
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {!offer.document_id && status === "draft" && (
                                <Button
                                    type="button"
                                    className="gap-2"
                                    disabled={isPending}
                                    onClick={handleGenerate}
                                >
                                    {isPending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <FileText className="size-4" />
                                    )}
                                    {t("buttons.generate_document") || "Generate document"}
                                </Button>
                            )}

                            {offer.document_id && documentIsDraft && (
                                <Link href={`/documents/issued/edit/${offer.document_id}`}>
                                    <Button type="button" variant="outline" className="gap-2">
                                        <Pencil className="size-4" />
                                        {t("buttons.edit")}
                                    </Button>
                                </Link>
                            )}

                            {offer.document_id && (
                                <Link href={`/documents/issued/${offer.document_id}`}>
                                    <Button type="button" variant="outline" className="gap-2">
                                        <ExternalLink className="size-4" />
                                        {t("routes.document_details")}
                                    </Button>
                                </Link>
                            )}

                            {offer.document_id && status === "draft" && (
                                <Button
                                    type="button"
                                    className="gap-2"
                                    disabled={isPending}
                                    onClick={handleSend}
                                >
                                    {isPending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Send className="size-4" />
                                    )}
                                    {t("buttons.send")}
                                </Button>
                            )}

                            {status === "sent" && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="gap-2"
                                    disabled={isPending}
                                    onClick={handleResend}
                                >
                                    {isPending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <RotateCw className="size-4" />
                                    )}
                                    {t("buttons.resend")}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {offer.document_id ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{t("buttons.preview")}</CardTitle>
                        <CardDescription>
                            {documentIsDraft
                                ? t("messages.hr.job_offer_preview_editable_hint") ||
                                  "Review the offer below. Use Edit to fill in or adjust the template variables before sending."
                                : t("messages.hr.job_offer_preview_sent_hint") ||
                                  "This offer has already been sent and can no longer be edited."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="document-preview max-w-none"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        {t("messages.hr.job_offer_no_document_hint") ||
                            "No document has been generated for this offer yet. Generate it to review and fill in the template variables before sending."}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

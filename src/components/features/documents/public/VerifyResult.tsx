"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Download, ShieldAlert, XCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import VerifyFileUpload from "./VerifyFileUpload";
import { ActionResponse } from "@/actions/common/common.actions";
import { downloadVerifiedPdf, PublicVerification } from "@/actions/public/document-public.actions";
import { toast } from "sonner";

export interface VerifyResultProps {
    code: string;
    initialVerification: ActionResponse<PublicVerification>;
}

function statusTone(value: string) {
    if (value === "completed") return "default" as const;
    if (value === "voided" || value === "declined" || value === "expired") return "destructive" as const;
    return "secondary" as const;
}

export default function VerifyResult({ code, initialVerification }: VerifyResultProps) {
    const t = useTranslations();

    if (!initialVerification.success) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <ShieldAlert className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>{t("messages.verify.not_found")}</EmptyTitle>
                    <EmptyDescription>{initialVerification.error}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    const doc = initialVerification.data;
    const isValid = doc.status.value === "completed";

    const handleDownload = async () => {
        const res = await downloadVerifiedPdf(code);
        if (!res.success) {
            toast.error(res.error);
            return;
        }
        const blob = await fetch(`data:${res.data.content_type};base64,${res.data.base64}`).then((r) =>
            r.blob(),
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = res.data.filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-5">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        {isValid ? (
                            <CheckCircle2 className="size-6 text-emerald-600" />
                        ) : (
                            <XCircle className="size-6 text-muted-foreground" />
                        )}
                        <div>
                            <CardTitle>{doc.title}</CardTitle>
                            <CardDescription>
                                {isValid ? t("messages.verify.valid") : t("messages.verify.invalid")}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusTone(doc.status.value)}>{doc.status.label}</Badge>
                        <span className="text-sm text-muted-foreground" dir="ltr">
                            {t("attributes.verification_code")}: {doc.public_code}
                        </span>
                    </div>

                    {doc.completed_at && (
                        <p className="text-sm text-muted-foreground">
                            {t("attributes.signed_at")}:{" "}
                            <span dir="ltr">{doc.completed_at.replace("T", " ").substring(0, 16)}</span>
                        </p>
                    )}

                    {doc.file_hash && (
                        <p className="text-sm text-muted-foreground">
                            {t("messages.verify.hash_label")}:{" "}
                            <code dir="ltr" className="text-xs">
                                {doc.file_hash}
                            </code>
                        </p>
                    )}

                    <div className="space-y-2">
                        <p className="text-sm font-medium">{t("attributes.signers")}</p>
                        {doc.signers.map((signer) => (
                            <div
                                key={signer.role}
                                className="flex items-center justify-between rounded-md border p-2 text-sm"
                            >
                                <span>
                                    {signer.name}{" "}
                                    <span className="text-muted-foreground">({signer.role})</span>
                                </span>
                                <Badge variant={signer.status === "signed" ? "default" : "outline"}>
                                    {signer.status}
                                </Badge>
                            </div>
                        ))}
                    </div>

                    {doc.pdf_downloadable && (
                        <Button type="button" variant="outline" onClick={handleDownload} className="gap-2">
                            <Download className="size-4" />
                            {t("buttons.download_pdf")}
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t("messages.verify.check_file")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <VerifyFileUpload code={code} />
                </CardContent>
            </Card>
        </div>
    );
}

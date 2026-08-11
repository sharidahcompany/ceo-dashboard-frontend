"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Copy, Loader2, Pencil } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCan } from "@/providers/AbilityProvider";

import DocumentSignerTimeline from "./DocumentSignerTimeline";
import DocumentActivityLog from "./DocumentActivityLog";
import DocumentActionsBar from "./DocumentActionsBar";
import InternalSignDialog from "./InternalSignDialog";
import {
    getDocument,
    getDocumentEvents,
    previewDocument,
    DocumentEventResource,
    DocumentResource,
    DocumentSignerResource,
} from "@/actions/workspace/documents.actions";

function statusVariant(value?: string) {
    switch (value) {
        case "completed":
            return "default" as const;
        case "voided":
        case "declined":
        case "expired":
            return "destructive" as const;
        case "pending_internal":
        case "pending_external":
            return "secondary" as const;
        default:
            return "outline" as const;
    }
}

export default function DocumentDetail() {
    const t = useTranslations();
    const params = useParams();
    const documentId = params?.id as string;

    const canEdit = useCan("workspace.document.update");

    const [loading, setLoading] = useState(true);
    const [document, setDocument] = useState<DocumentResource | null>(null);
    const [html, setHtml] = useState("");
    const [events, setEvents] = useState<DocumentEventResource[]>([]);

    const load = useCallback(async () => {
        const [docRes, previewRes, eventsRes] = await Promise.all([
            getDocument(documentId),
            previewDocument(documentId),
            getDocumentEvents(documentId),
        ]);

        if (docRes.success) setDocument(docRes.data);
        else toast.error(docRes.error);

        if (previewRes.success) setHtml(previewRes.data.html);
        if (eventsRes.success) setEvents(eventsRes.data);

        setLoading(false);
    }, [documentId]);

    useEffect(() => {
        load();
    }, [load]);

    const copyVerifyLink = () => {
        if (!document) return;
        const url = `${window.location.origin}/verify/${document.public_code}`;
        navigator.clipboard.writeText(url).then(
            () => toast.success(t("messages.documents.verify_link_copied")),
            () => toast.error(t("errors.something_went_wrong")),
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!document) {
        return null;
    }

    return (
        <div className="space-y-5">
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <CardTitle className="flex flex-wrap items-center gap-2">
                                {document.title}
                                <Badge variant={statusVariant(document.status?.value)}>
                                    {document.status?.label}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {t("attributes.verification_code")}:{" "}
                                <code dir="ltr">{document.public_code}</code>
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2"
                                onClick={copyVerifyLink}
                            >
                                <Copy className="size-4" />
                                {t("buttons.copy_verify_link")}
                            </Button>

                            <DocumentActionsBar document={document} onChanged={load} />

                            {canEdit && document.is_editable && (
                                <Link href={`/documents/issued/edit/${document.id}`}>
                                    <Button type="button" variant="outline" className="gap-2">
                                        <Pencil className="size-4" />
                                        {t("buttons.edit")}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="preview">
                <TabsList>
                    <TabsTrigger value="preview">{t("buttons.preview")}</TabsTrigger>
                    <TabsTrigger value="signers">{t("attributes.signers")}</TabsTrigger>
                    <TabsTrigger value="activity">{t("messages.documents.activity")}</TabsTrigger>
                </TabsList>

                <TabsContent value="preview">
                    <Card>
                        <CardContent className="pt-5">
                            {/* Server-rendered from the document's own snapshot, and
                                sanitized on write with the `document` Purifier profile. */}
                            <div
                                className="document-preview max-w-none"
                                dangerouslySetInnerHTML={{ __html: html }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="signers">
                    <Card>
                        <CardContent className="pt-5">
                            <DocumentSignerTimeline
                                document={document}
                                renderAction={(signer: DocumentSignerResource) => {
                                    // Only the current, unsigned, internal signer
                                    // gets a "sign now" control here — external
                                    // parties sign exclusively through their
                                    // emailed link.
                                    const canSignHere =
                                        document.is_pending &&
                                        signer.order === document.current_step &&
                                        signer.party.value === "internal" &&
                                        signer.status.value !== "signed";

                                    if (!canSignHere) return null;

                                    // The anchor type (signature vs stamp) lives
                                    // on the template, keyed by the same role.
                                    const anchor = document.template?.anchors?.find(
                                        (a) => a.role === signer.role,
                                    );

                                    return (
                                        <InternalSignDialog
                                            documentId={document.id}
                                            role={signer.role}
                                            anchorType={
                                                anchor?.type.value === "stamp" ? "stamp" : "signature"
                                            }
                                            onSigned={load}
                                        />
                                    );
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity">
                    <Card>
                        <CardContent className="pt-5">
                            <DocumentActivityLog events={events} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

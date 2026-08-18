"use client";

import React, { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, Loader2, PenLine, ShieldAlert, XCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import SignaturePad, { SignaturePadHandle } from "@/components/features/documents/signature/SignaturePad";
import {
    ActionResponse,
} from "@/actions/common/common.actions";
import {
    declineSignature,
    getSigningSession,
    submitSignature,
    PublicSigningSession,
} from "@/actions/public/document-public.actions";

export interface PublicSignClientProps {
    token: string;
    initialSession: ActionResponse<PublicSigningSession>;
}

/**
 * The page an external signer lands on. No login, no dashboard chrome — just
 * the document, a signature pad, and sign/decline.
 */
export default function PublicSignClient({ token, initialSession }: PublicSignClientProps) {
    const t = useTranslations();
    const [session, setSession] = useState(initialSession);
    const [isPending, startTransition] = useTransition();
    const [declineOpen, setDeclineOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState("");

    const padRef = useRef<SignaturePadHandle>(null);

    if (!session.success) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <ShieldAlert className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>{t("messages.public_sign.expired")}</EmptyTitle>
                    <EmptyDescription>{session.error}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    const { document: doc, signer } = session.data;

    if (signer.already_signed) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <CheckCircle2 className="size-5 text-emerald-600" />
                    </EmptyMedia>
                    <EmptyTitle>{t("messages.public_sign.already_signed")}</EmptyTitle>
                    <EmptyDescription>{t("messages.public_sign.thank_you")}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    if (signer.status === "declined") {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <XCircle className="size-5 text-destructive" />
                    </EmptyMedia>
                    <EmptyTitle>{t("messages.public_sign.declined")}</EmptyTitle>
                </EmptyHeader>
            </Empty>
        );
    }

    const refresh = async () => {
        const res = await getSigningSession(token);
        setSession(res);
    };

    const handleSign = () => {
        const result = padRef.current?.getResult();

        if (!result) {
            toast.error(t("validation.signature_required"));
            return;
        }

        startTransition(async () => {
            const res = await submitSignature(token, {
                signature_kind: result.kind,
                signature_data: result.dataUrl,
                typed_name: result.typedName,
                typed_font: result.typedFont,
            });

            if (!res.success) {
                toast.error(res.error);
                return;
            }

            toast.success(res.message || t("success"));
            await refresh();
        });
    };

    const handleDecline = () => {
        startTransition(async () => {
            const res = await declineSignature(token, declineReason || undefined);

            if (!res.success) {
                toast.error(res.error);
                return;
            }

            setDeclineOpen(false);
            await refresh();
        });
    };

    return (
        <div className="space-y-5">
            <Card>
                <CardHeader>
                    <CardTitle>{doc.title}</CardTitle>
                    <CardDescription>
                        {t("messages.public_sign.intro", { name: signer.name })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Server-rendered from the document's own snapshot, sanitized
                        on write with the `document` Purifier profile. */}
                    <div
                        className="document-preview max-w-none rounded-md border bg-white p-4"
                        dangerouslySetInnerHTML={{ __html: doc.html }}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <PenLine className="size-4" />
                        {t("buttons.sign_now")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <SignaturePad ref={padRef} />

                    <div className="flex flex-wrap justify-end gap-2">
                        <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
                            <DialogTrigger
                                render={
                                    <Button type="button" variant="outline" disabled={isPending}>
                                        {t("buttons.decline")}
                                    </Button>
                                }
                            />
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{t("buttons.decline")}</DialogTitle>
                                    <DialogDescription>
                                        {t("messages.public_sign.decline_confirm")}
                                    </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    placeholder={t("attributes.decline_reason")}
                                    rows={3}
                                />
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDeclineOpen(false)}
                                    >
                                        {t("buttons.cancel")}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleDecline}
                                        disabled={isPending}
                                        className="gap-2"
                                    >
                                        {isPending && <Loader2 className="size-4 animate-spin" />}
                                        {t("buttons.decline")}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button type="button" onClick={handleSign} disabled={isPending} className="gap-2">
                            {isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <PenLine className="size-4" />
                            )}
                            {t("buttons.sign_now")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

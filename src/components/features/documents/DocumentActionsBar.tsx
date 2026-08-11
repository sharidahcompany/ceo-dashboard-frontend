"use client";

import React, { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Send, Ban } from "lucide-react";

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
import { useCan } from "@/providers/AbilityProvider";
import { startDocument, voidDocument } from "@/actions/workspace/signature-assets.actions";
import { DocumentResource } from "@/actions/workspace/documents.actions";

export interface DocumentActionsBarProps {
    document: DocumentResource;
    onChanged: () => void;
}

/**
 * Send-for-signature and void — the two actions that change a document's
 * trajectory rather than its content.
 */
export default function DocumentActionsBar({ document, onChanged }: DocumentActionsBarProps) {
    const t = useTranslations();
    const canSend = useCan("workspace.document.send");
    const canVoid = useCan("workspace.document.void");

    const [isPending, startTransition] = useTransition();
    const [voidOpen, setVoidOpen] = useState(false);
    const [reason, setReason] = useState("");

    const handleStart = () => {
        startTransition(async () => {
            const res = await startDocument(document.id);
            if (!res.success) {
                toast.error(res.error);
                return;
            }
            toast.success(res.message || t("success"));
            onChanged();
        });
    };

    const handleVoid = () => {
        startTransition(async () => {
            const res = await voidDocument(document.id, reason || undefined);
            if (!res.success) {
                toast.error(res.error);
                return;
            }
            toast.success(res.message || t("success"));
            setVoidOpen(false);
            onChanged();
        });
    };

    return (
        <div className="flex flex-wrap gap-2">
            {canSend && document.status.value === "draft" && (
                <Button type="button" onClick={handleStart} disabled={isPending} className="gap-2">
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    {t("buttons.send_for_signature")}
                </Button>
            )}

            {canVoid && !document.is_terminal && (
                <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
                    <DialogTrigger>
                        <Button type="button" variant="outline" className="gap-2 text-destructive">
                            <Ban className="size-4" />
                            {t("buttons.void")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t("buttons.void")}</DialogTitle>
                            <DialogDescription>
                                {t("messages.documents.void_confirm")}
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t("attributes.decline_reason")}
                            rows={3}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setVoidOpen(false)}>
                                {t("buttons.cancel")}
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleVoid}
                                disabled={isPending}
                                className="gap-2"
                            >
                                {isPending && <Loader2 className="size-4 animate-spin" />}
                                {t("buttons.void")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

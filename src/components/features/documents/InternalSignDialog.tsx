"use client";

import React, { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, PenLine } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import SignaturePad, { SignaturePadHandle } from "./signature/SignaturePad";
import SignatureAssetPicker from "./signature/SignatureAssetPicker";
import { signDocument } from "@/actions/workspace/signature-assets.actions";
import { SignatureAssetResource } from "@/actions/workspace/signature-assets.actions";

export interface InternalSignDialogProps {
    documentId: number | string;
    role: string;
    /** Stamps only ever come from a saved asset; signatures may also be drawn. */
    anchorType: "signature" | "stamp";
    onSigned: () => void;
}

/**
 * The in-dashboard signing control for whichever internal signer is up next.
 *
 * A stamp anchor skips straight to the saved-assets picker — you cannot draw
 * a company stamp by hand — while a signature anchor offers new-vs-saved.
 */
export default function InternalSignDialog({
    documentId,
    role,
    anchorType,
    onSigned,
}: InternalSignDialogProps) {
    const t = useTranslations();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [mode, setMode] = useState<"new" | "saved">(anchorType === "stamp" ? "saved" : "new");
    const [selectedAsset, setSelectedAsset] = useState<SignatureAssetResource | null>(null);
    const [saveAsAsset, setSaveAsAsset] = useState(false);

    const padRef = useRef<SignaturePadHandle>(null);

    const submit = () => {
        startTransition(async () => {
            let payload: Parameters<typeof signDocument>[1];

            if (mode === "saved") {
                if (!selectedAsset) {
                    toast.error(t("messages.documents.pick_a_saved_signature"));
                    return;
                }
                payload = {
                    role,
                    signature_kind: anchorType === "stamp" ? "stamp" : "uploaded",
                    signature_asset_id: selectedAsset.id,
                };
            } else {
                const result = padRef.current?.getResult();
                if (!result) {
                    toast.error(t("validation.signature_required"));
                    return;
                }
                payload = {
                    role,
                    signature_kind: result.kind === "drawn" ? "drawn" : result.kind === "typed" ? "typed" : "uploaded",
                    signature_data: result.dataUrl,
                    typed_name: result.typedName,
                    typed_font: result.typedFont,
                    save_as_asset: saveAsAsset,
                };
            }

            const res = await signDocument(documentId, payload);
            if (!res.success) {
                toast.error(res.error);
                return;
            }

            toast.success(res.message || t("success"));
            setOpen(false);
            onSigned();
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button type="button" size="sm" className="gap-2">
                    <PenLine className="size-4" />
                    {anchorType === "stamp" ? t("buttons.apply_stamp") : t("buttons.sign_now")}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {anchorType === "stamp" ? t("buttons.apply_stamp") : t("buttons.sign_now")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("messages.documents.sign_dialog_title")}
                    </DialogDescription>
                </DialogHeader>

                {anchorType === "signature" && (
                    <Tabs value={mode} onValueChange={(v) => v && setMode(v as "new" | "saved")}>
                        <TabsList>
                            <TabsTrigger value="new">{t("messages.documents.new_signature")}</TabsTrigger>
                            <TabsTrigger value="saved">{t("messages.documents.saved_signature")}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="new" className="space-y-3">
                            <SignaturePad ref={padRef} />
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={saveAsAsset}
                                    onCheckedChange={(c) => setSaveAsAsset(Boolean(c))}
                                />
                                {t("messages.documents.save_signature_for_next_time")}
                            </label>
                        </TabsContent>

                        <TabsContent value="saved">
                            <SignatureAssetPicker
                                type="signature"
                                selectedId={selectedAsset?.id ?? null}
                                onSelect={setSelectedAsset}
                            />
                        </TabsContent>
                    </Tabs>
                )}

                {anchorType === "stamp" && (
                    <SignatureAssetPicker
                        type="stamp"
                        selectedId={selectedAsset?.id ?? null}
                        onSelect={setSelectedAsset}
                    />
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                        {t("buttons.cancel")}
                    </Button>
                    <Button type="button" onClick={submit} disabled={isPending} className="gap-2">
                        {isPending && <Loader2 className="size-4 animate-spin" />}
                        {t("buttons.save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

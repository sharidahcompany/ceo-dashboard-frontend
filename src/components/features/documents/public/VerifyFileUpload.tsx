"use client";

import React, { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyDocumentFile } from "@/actions/public/document-public.actions";

export interface VerifyFileUploadProps {
    code: string;
}

/**
 * Lets a visitor hash-check a PDF they already have against the one on file,
 * without ever needing the server to hand back the document itself.
 */
export default function VerifyFileUpload({ code }: VerifyFileUploadProps) {
    const t = useTranslations();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<boolean | null>(null);

    const handleFile = (file: File | undefined) => {
        if (!file) return;
        setResult(null);

        startTransition(async () => {
            const formData = new FormData();
            formData.append("file", file);

            const res = await verifyDocumentFile(code, formData);
            if (!res.success) {
                toast.error(res.error);
                return;
            }

            setResult(res.data.matches);
        });
    };

    return (
        <div className="space-y-3">
            <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-muted/40">
                {isPending ? (
                    <Loader2 className="size-5 animate-spin" />
                ) : (
                    <Upload className="size-5" />
                )}
                {t("messages.verify.check_file")}
                <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    disabled={isPending}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                />
            </label>

            {result !== null && (
                <div
                    className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
                        result
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-destructive/30 bg-destructive/5 text-destructive"
                    }`}
                >
                    {result ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                    {result ? t("messages.verify.file_match") : t("messages.verify.file_mismatch")}
                </div>
            )}
        </div>
    );
}

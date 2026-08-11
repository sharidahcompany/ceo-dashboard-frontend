"use client";

import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

export interface SignatureUploadHandle {
    toDataUrl: () => string | null;
    isEmpty: () => boolean;
}

const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Standalone (not RHF-bound) image upload that reads straight to a data URI,
 * matching what the draw and type tabs produce — the parent SignaturePad
 * treats all three identically.
 */
const SignatureUpload = forwardRef<SignatureUploadHandle>(function SignatureUpload(_props, ref) {
    const t = useTranslations();
    const inputRef = useRef<HTMLInputElement>(null);
    const [dataUrl, setDataUrl] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
        toDataUrl: () => dataUrl,
        isEmpty: () => dataUrl === null,
    }));

    const handleFile = (file: File | undefined) => {
        if (!file) return;

        if (!["image/png", "image/jpeg"].includes(file.type)) {
            toast.error(t("messages.public_sign.upload_invalid_type"));
            return;
        }
        if (file.size > MAX_BYTES) {
            toast.error(t("validation.file_size_max", { max: 4 }));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setDataUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    if (dataUrl) {
        return (
            <div className="space-y-2">
                <div className="relative flex h-[140px] items-center justify-center rounded-md border bg-white">
                    <Image src={dataUrl} alt="" width={200} height={100} className="max-h-full object-contain" unoptimized />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-2 top-2"
                        onClick={() => {
                            setDataUrl(null);
                            if (inputRef.current) inputRef.current.value = "";
                        }}
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <label className="flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-muted/40">
            <Upload className="size-5" />
            {t("buttons.upload_file")}
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
            />
        </label>
    );
});

export default SignatureUpload;

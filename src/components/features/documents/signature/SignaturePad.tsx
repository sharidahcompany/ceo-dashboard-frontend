"use client";

import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import SignatureCanvas, { SignatureCanvasHandle } from "./SignatureCanvas";
import SignatureTyped, { SignatureTypedHandle } from "./SignatureTyped";
import SignatureUpload, { SignatureUploadHandle } from "./SignatureUpload";

export type SignatureSourceKind = "drawn" | "typed" | "uploaded";

export interface SignatureResult {
    kind: SignatureSourceKind;
    dataUrl: string;
    typedName?: string;
    typedFont?: string;
}

export interface SignaturePadHandle {
    /** null when the active tab has nothing usable yet. */
    getResult: () => SignatureResult | null;
}

export interface SignaturePadProps {
    height?: number;
}

/**
 * Tabbed signature capture: draw on a canvas, type a name in a script font, or
 * upload an image. Whichever tab is active when the caller reads getResult()
 * is what gets submitted — the other tabs' state is simply not consulted.
 */
const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
    { height = 180 },
    ref,
) {
    const t = useTranslations();
    const [tab, setTab] = useState<SignatureSourceKind>("drawn");

    const canvasRef = useRef<SignatureCanvasHandle>(null);
    const typedRef = useRef<SignatureTypedHandle>(null);
    const uploadRef = useRef<SignatureUploadHandle>(null);

    useImperativeHandle(ref, () => ({
        getResult: () => {
            if (tab === "drawn") {
                const dataUrl = canvasRef.current?.toDataUrl();
                return dataUrl ? { kind: "drawn", dataUrl } : null;
            }

            if (tab === "typed") {
                const dataUrl = typedRef.current?.toDataUrl();
                if (!dataUrl) return null;
                return {
                    kind: "typed",
                    dataUrl,
                    typedName: typedRef.current?.getTypedName(),
                    typedFont: typedRef.current?.getFont(),
                };
            }

            const dataUrl = uploadRef.current?.toDataUrl();
            return dataUrl ? { kind: "uploaded", dataUrl } : null;
        },
    }));

    return (
        <Tabs value={tab} onValueChange={(v) => v && setTab(v as SignatureSourceKind)}>
            <TabsList>
                <TabsTrigger value="drawn">{t("messages.public_sign.tabs.draw")}</TabsTrigger>
                <TabsTrigger value="typed">{t("messages.public_sign.tabs.type")}</TabsTrigger>
                <TabsTrigger value="uploaded">{t("messages.public_sign.tabs.upload")}</TabsTrigger>
            </TabsList>

            <TabsContent value="drawn">
                <SignatureCanvas ref={canvasRef} height={height} />
            </TabsContent>
            <TabsContent value="typed">
                <SignatureTyped ref={typedRef} />
            </TabsContent>
            <TabsContent value="uploaded">
                <SignatureUpload ref={uploadRef} />
            </TabsContent>
        </Tabs>
    );
});

export default SignaturePad;

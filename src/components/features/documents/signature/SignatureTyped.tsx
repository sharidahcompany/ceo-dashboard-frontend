"use client";

import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Great_Vibes, Dancing_Script, Sacramento } from "next/font/google";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-sig-gv" });
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-sig-ds" });
const sacramento = Sacramento({ weight: "400", subsets: ["latin"], variable: "--font-sig-sc" });

const FONTS = [
    { id: "great-vibes", label: "Great Vibes", className: greatVibes.className, cssVar: greatVibes.style.fontFamily },
    { id: "dancing-script", label: "Dancing Script", className: dancingScript.className, cssVar: dancingScript.style.fontFamily },
    { id: "sacramento", label: "Sacramento", className: sacramento.className, cssVar: sacramento.style.fontFamily },
] as const;

export interface SignatureTypedHandle {
    toDataUrl: () => string | null;
    isEmpty: () => boolean;
    getTypedName: () => string;
    getFont: () => string;
}

/**
 * Renders a typed name in a script font to an offscreen canvas, producing the
 * same kind of transparent PNG the drawn pad does — so both feed the same
 * upload path without the backend needing to know which tab was used.
 */
const SignatureTyped = forwardRef<SignatureTypedHandle>(function SignatureTyped(_props, ref) {
    const t = useTranslations();
    const [name, setName] = useState("");
    const [fontId, setFontId] = useState<(typeof FONTS)[number]["id"]>(FONTS[0].id);

    const font = FONTS.find((f) => f.id === fontId)!;

    useImperativeHandle(ref, () => ({
        isEmpty: () => name.trim() === "",
        getTypedName: () => name.trim(),
        getFont: () => fontId,
        toDataUrl: () => {
            const trimmed = name.trim();
            if (!trimmed) return null;

            const canvas = document.createElement("canvas");
            const scale = 3;
            canvas.width = 700 * scale;
            canvas.height = 180 * scale;

            const ctx = canvas.getContext("2d");
            if (!ctx) return null;

            ctx.scale(scale, scale);
            ctx.clearRect(0, 0, 700, 180);
            ctx.fillStyle = "#111827";
            ctx.font = `56px ${font.cssVar}`;
            ctx.textBaseline = "middle";
            ctx.textAlign = "left";
            ctx.fillText(trimmed, 20, 100, 660);

            return canvas.toDataURL("image/png");
        },
    }));

    return (
        <div className="space-y-3">
            <Input
                dir="ltr"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("messages.public_sign.typed_placeholder")}
            />

            <div className="flex flex-wrap gap-2">
                {FONTS.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => setFontId(f.id)}
                        className={cn(
                            "rounded-md border px-3 py-1 text-xs",
                            fontId === f.id ? "border-primary bg-primary/5" : "border-input",
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div
                dir="ltr"
                className="flex h-[100px] items-center rounded-md border border-dashed bg-white px-4"
            >
                <span className={cn(font.className, "text-4xl text-gray-900")}>
                    {name || t("messages.public_sign.typed_preview_placeholder")}
                </span>
            </div>
        </div>
    );
});

export default SignatureTyped;

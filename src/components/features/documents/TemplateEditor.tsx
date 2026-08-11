"use client";

import React, { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Braces, PenLine, Stamp } from "lucide-react";

import "react-quill-new/dist/quill.snow.css";

/**
 * react-quill-new has to be client-only, and we need a handle on the underlying
 * Quill instance to insert tokens at the caret — hence the forwardedRef shim.
 */
const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import("react-quill-new");
        const Wrapped = ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
        Wrapped.displayName = "ReactQuill";
        return Wrapped;
    },
    { ssr: false },
);

const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ direction: "rtl" }, { align: [] }],
        ["blockquote", "link", "clean"],
    ],
};

/** Mirrors the backend's strict token grammar (TemplateParser). */
const KEY_PATTERN = /^[A-Za-z0-9_]{1,64}$/;
const ROLE_PATTERN = /^[A-Za-z0-9_]{1,32}$/;

type InsertKind = "placeholder" | "signature" | "stamp";

export interface TemplateEditorProps {
    value: string;
    onChange: (html: string) => void;
}

export default function TemplateEditor({ value, onChange }: TemplateEditorProps) {
    const t = useTranslations();
    const quillRef = useRef<any>(null);

    const [insertKind, setInsertKind] = useState<InsertKind | null>(null);
    const [draft, setDraft] = useState("");
    const [error, setError] = useState<string | null>(null);

    const openInsert = (kind: InsertKind) => {
        setInsertKind(kind);
        setDraft("");
        setError(null);
    };

    const insertToken = useCallback(
        (token: string) => {
            const editor = quillRef.current?.getEditor?.();
            if (!editor) return;

            const range = editor.getSelection(true);
            const index = range ? range.index : editor.getLength();

            editor.insertText(index, token, "user");

            // Tokens are matched against the raw HTML on the backend, so any
            // inline formatting spanning them (bold, colour, a link) would split
            // them into unmatchable fragments. Stripping formatting on the
            // inserted range is what keeps them intact.
            editor.removeFormat(index, token.length, "user");
            editor.setSelection(index + token.length, 0, "user");
        },
        [],
    );

    const confirmInsert = () => {
        const raw = draft.trim();

        if (insertKind === "placeholder") {
            if (!KEY_PATTERN.test(raw)) {
                setError(t("validation.invalid_placeholder_key"));
                return;
            }
            insertToken(`{{${raw.toLowerCase()}}}`);
        } else {
            if (!ROLE_PATTERN.test(raw)) {
                setError(t("validation.invalid_anchor_role"));
                return;
            }
            const type = insertKind === "signature" ? "SIGNATURE" : "STAMP";
            insertToken(`[[${type}:${raw.toLowerCase()}]]`);
        }

        setInsertKind(null);
    };

    const dialogTitle =
        insertKind === "placeholder"
            ? t("buttons.insert_placeholder")
            : insertKind === "signature"
              ? t("buttons.insert_signature")
              : t("buttons.insert_stamp");

    const dialogHint =
        insertKind === "placeholder"
            ? t("messages.document_templates.placeholder_hint")
            : t("messages.document_templates.anchor_hint");

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => openInsert("placeholder")}
                >
                    <Braces className="size-4" />
                    {t("buttons.insert_placeholder")}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => openInsert("signature")}
                >
                    <PenLine className="size-4" />
                    {t("buttons.insert_signature")}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => openInsert("stamp")}
                >
                    <Stamp className="size-4" />
                    {t("buttons.insert_stamp")}
                </Button>
            </div>

            {/* Quill ships its own LTR-oriented chrome; the editor body still
                honours the document direction via the toolbar's rtl control. */}
            <div className="document-template-editor" dir="ltr">
                <ReactQuill
                    forwardedRef={quillRef}
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    modules={quillModules}
                    placeholder={t("messages.document_templates.body_placeholder")}
                />
            </div>

            <Dialog open={insertKind !== null} onOpenChange={(open) => !open && setInsertKind(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                        <DialogDescription>{dialogHint}</DialogDescription>
                    </DialogHeader>

                    <Input
                        autoFocus
                        value={draft}
                        dir="ltr"
                        onChange={(e) => {
                            setDraft(e.target.value);
                            setError(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                confirmInsert();
                            }
                        }}
                        placeholder={insertKind === "placeholder" ? "client_name" : "ceo"}
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setInsertKind(null)}>
                            {t("buttons.cancel")}
                        </Button>
                        <Button type="button" onClick={confirmInsert} disabled={!draft.trim()}>
                            {t("buttons.insert")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

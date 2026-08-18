"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export interface KeyValueListEditorProps {
    /** Seeds the initial rows. Not re-synced after mount — same one-time-load pattern every other form in this app uses. */
    value?: Record<string, string> | null;
    onChange: (value: Record<string, string>) => void;
    disabled?: boolean;
}

interface Row {
    key: string;
    value: string;
}

/**
 * Free-form key/value rows for a record's `custom_fields` JSON column —
 * lets HR attach ad-hoc data (e.g. a badge number, a locker key) without a
 * schema change, the same array-of-rows editing pattern SignerListEditor
 * uses for template signers.
 */
export default function KeyValueListEditor({ value, onChange, disabled }: KeyValueListEditorProps) {
    const t = useTranslations();
    const [rows, setRows] = useState<Row[]>(() =>
        Object.entries(value ?? {}).map(([key, val]) => ({ key, value: String(val) })),
    );

    const emit = (next: Row[]) => {
        setRows(next);

        const record: Record<string, string> = {};
        next.forEach((row) => {
            const key = row.key.trim();
            if (key) record[key] = row.value;
        });

        onChange(record);
    };

    return (
        <div className="space-y-2">
            {rows.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Input
                        value={row.key}
                        disabled={disabled}
                        placeholder={t("attributes.field_name") || "Field name"}
                        onChange={(e) =>
                            emit(rows.map((r, i) => (i === index ? { ...r, key: e.target.value } : r)))
                        }
                    />
                    <Input
                        value={row.value}
                        disabled={disabled}
                        placeholder={t("attributes.field_value") || "Value"}
                        onChange={(e) =>
                            emit(rows.map((r, i) => (i === index ? { ...r, value: e.target.value } : r)))
                        }
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        onClick={() => emit(rows.filter((_, i) => i !== index))}
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                className="gap-2"
                onClick={() => emit([...rows, { key: "", value: "" }])}
            >
                <Plus className="size-4" />
                {t("buttons.add_field") || "Add field"}
            </Button>
        </div>
    );
}

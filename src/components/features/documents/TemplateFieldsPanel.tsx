"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Braces, PenLine, Stamp } from "lucide-react";
import {
    DocumentTemplateAnchorResource,
    DocumentTemplateFieldResource,
} from "@/actions/workspace/document-templates.actions";
import SignatureAssetPicker from "@/components/features/documents/signature/SignatureAssetPicker";

const FIELD_TYPES = ["text", "textarea", "number", "date", "select", "boolean", "employee"] as const;
const PARTIES = ["internal", "external"] as const;

export interface TemplateFieldsPanelProps {
    fields: DocumentTemplateFieldResource[];
    anchors: DocumentTemplateAnchorResource[];
    disabled?: boolean;
    onFieldChange: (key: string, patch: Partial<DocumentTemplateFieldResource>) => void;
    onAnchorChange: (
        type: string,
        role: string,
        patch: Partial<DocumentTemplateAnchorResource>,
    ) => void;
}

/**
 * Right rail of the builder: the fields and markers the backend parsed out of
 * the body, with the presentation metadata that the body text cannot express.
 *
 * Keys and roles are read-only here — they follow the body.
 */
export default function TemplateFieldsPanel({
    fields,
    anchors,
    disabled,
    onFieldChange,
    onAnchorChange,
}: TemplateFieldsPanelProps) {
    const t = useTranslations();

    return (
        <div className="space-y-5">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Braces className="size-4" />
                        {t("messages.document_templates.fields_detected")}
                        <Badge variant="outline">{fields.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                        {t("messages.document_templates.fields_detected_hint")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            {t("messages.document_templates.no_fields")}
                        </p>
                    )}

                    {fields.map((field) => (
                        <div key={field.key} className="space-y-2 rounded-md border p-3">
                            <code className="text-xs text-muted-foreground" dir="ltr">
                                {`{{${field.key}}}`}
                            </code>

                            <Input
                                value={field.label}
                                disabled={disabled}
                                onChange={(e) => onFieldChange(field.key, { label: e.target.value })}
                                placeholder={t("attributes.label")}
                            />

                            <div className="flex items-center gap-2">
                                <Select
                                    value={field.type.value}
                                    disabled={disabled}
                                    onValueChange={(v) =>
                                        v &&
                                        onFieldChange(field.key, {
                                            type: { value: v, label: t(`enums.documentFieldType.${v}`) },
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue>
                                            {t(`enums.documentFieldType.${field.type.value}`)}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FIELD_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {t(`enums.documentFieldType.${type}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* A dropdown with no options can never be filled in,
                                so the backend rejects that combination. */}
                            {field.type.value === "select" && (
                                <Input
                                    value={(field.options ?? []).join(", ")}
                                    disabled={disabled}
                                    onChange={(e) =>
                                        onFieldChange(field.key, {
                                            options: e.target.value
                                                .split(",")
                                                .map((o) => o.trim())
                                                .filter(Boolean),
                                        })
                                    }
                                    placeholder={t("messages.document_templates.options_hint")}
                                />
                            )}

                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={field.required}
                                    disabled={disabled}
                                    onCheckedChange={(checked) =>
                                        onFieldChange(field.key, { required: Boolean(checked) })
                                    }
                                />
                                {t("attributes.required")}
                            </label>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <PenLine className="size-4" />
                        {t("messages.document_templates.anchors_detected")}
                        <Badge variant="outline">{anchors.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                        {t("messages.document_templates.anchors_detected_hint")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {anchors.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            {t("messages.document_templates.no_anchors")}
                        </p>
                    )}

                    {anchors.map((anchor) => (
                        <div
                            key={`${anchor.type.value}:${anchor.role}`}
                            className="space-y-2 rounded-md border p-3"
                        >
                            <div className="flex items-center gap-2">
                                {anchor.type.value === "stamp" ? (
                                    <Stamp className="size-4 text-muted-foreground" />
                                ) : (
                                    <PenLine className="size-4 text-muted-foreground" />
                                )}
                                <code className="text-xs text-muted-foreground" dir="ltr">
                                    {anchor.token}
                                </code>
                            </div>

                            <Select
                                value={anchor.party.value}
                                disabled={disabled}
                                onValueChange={(v) =>
                                    v &&
                                    onAnchorChange(anchor.type.value, anchor.role, {
                                        party: { value: v, label: t(`enums.signerParty.${v}`) },
                                    })
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue>
                                        {t(`enums.signerParty.${anchor.party.value}`)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {PARTIES.map((party) => (
                                        <SelectItem key={party} value={party}>
                                            {t(`enums.signerParty.${party}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={anchor.required}
                                    disabled={disabled}
                                    onCheckedChange={(checked) =>
                                        onAnchorChange(anchor.type.value, anchor.role, {
                                            required: Boolean(checked),
                                        })
                                    }
                                />
                                {t("attributes.required")}
                            </label>

                            {/* Only an internal signer can be pre-fulfilled from a
                                saved asset — external signers always sign live. */}
                            {anchor.party.value === "internal" && (
                                <div className="space-y-2 border-t pt-2">
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={anchor.auto_sign ?? false}
                                            disabled={disabled}
                                            onCheckedChange={(checked) =>
                                                onAnchorChange(anchor.type.value, anchor.role, {
                                                    auto_sign: Boolean(checked),
                                                    signature_asset_id: checked ? anchor.signature_asset_id : null,
                                                })
                                            }
                                        />
                                        {t("messages.document_templates.auto_sign_label") || "Auto-sign with saved signature/stamp"}
                                    </label>

                                    {anchor.auto_sign && (
                                        <SignatureAssetPicker
                                            type={anchor.type.value === "stamp" ? "stamp" : "signature"}
                                            selectedId={anchor.signature_asset_id ?? null}
                                            onSelect={(asset) =>
                                                onAnchorChange(anchor.type.value, anchor.role, {
                                                    signature_asset_id: asset.id,
                                                })
                                            }
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

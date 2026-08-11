"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { PenLine, Stamp } from "lucide-react";
import { DocumentTemplateAnchorResource } from "@/actions/workspace/document-templates.actions";
import { DocumentSignerData } from "@/actions/workspace/documents.actions";

export interface SignerListEditorProps {
    anchors: DocumentTemplateAnchorResource[];
    signers: Record<string, DocumentSignerData>;
    disabled?: boolean;
    onChange: (role: string, patch: Partial<DocumentSignerData>) => void;
}

/**
 * One row per signature/stamp marker in the template.
 *
 * The rows are driven by the template's anchors rather than being freely
 * added: every required marker must have exactly one signer, which is what the
 * backend enforces too.
 */
export default function SignerListEditor({
    anchors,
    signers,
    disabled,
    onChange,
}: SignerListEditorProps) {
    const t = useTranslations();

    // Group by signing step so the ordering is visible: everyone in a step
    // signs before the next step is invited.
    const steps = Array.from(
        new Set(anchors.map((a) => signers[a.role]?.order ?? (a.party.value === "external" ? 2 : 1))),
    ).sort((a, b) => a - b);

    if (anchors.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                {t("messages.documents.no_anchors_in_template")}
            </p>
        );
    }

    return (
        <div className="space-y-5">
            {steps.map((step) => {
                const rows = anchors.filter(
                    (a) =>
                        (signers[a.role]?.order ?? (a.party.value === "external" ? 2 : 1)) === step,
                );

                return (
                    <div key={step} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                                {t("messages.documents.step_n", { step })}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {rows.some((r) => signers[r.role]?.party === "external")
                                    ? t("messages.documents.step_external_hint")
                                    : t("messages.documents.step_internal_hint")}
                            </span>
                        </div>

                        {rows.map((anchor) => {
                            const signer = signers[anchor.role];
                            const isExternal = signer?.party === "external";

                            return (
                                <Card key={anchor.role}>
                                    <CardContent className="space-y-3 pt-5">
                                        <div className="flex items-center gap-2">
                                            {anchor.type.value === "stamp" ? (
                                                <Stamp className="size-4 text-muted-foreground" />
                                            ) : (
                                                <PenLine className="size-4 text-muted-foreground" />
                                            )}
                                            <code className="text-xs text-muted-foreground" dir="ltr">
                                                {anchor.role}
                                            </code>
                                            <Badge variant="outline">
                                                {t(`enums.documentAnchorType.${anchor.type.value}`)}
                                            </Badge>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2">
                                            <Field>
                                                <FieldLabel>{t("attributes.party")}</FieldLabel>
                                                <FieldContent>
                                                    <Select
                                                        value={signer?.party ?? "internal"}
                                                        disabled={disabled}
                                                        onValueChange={(v) =>
                                                            v &&
                                                            onChange(anchor.role, {
                                                                party: v,
                                                                order: v === "external" ? 2 : 1,
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue>
                                                                {t(
                                                                    `enums.signerParty.${signer?.party ?? "internal"}`,
                                                                )}
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="internal">
                                                                {t("enums.signerParty.internal")}
                                                            </SelectItem>
                                                            <SelectItem value="external">
                                                                {t("enums.signerParty.external")}
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FieldContent>
                                            </Field>

                                            <Field>
                                                <FieldLabel>{t("attributes.order")}</FieldLabel>
                                                <FieldContent>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        dir="ltr"
                                                        disabled={disabled}
                                                        value={signer?.order ?? 1}
                                                        onChange={(e) =>
                                                            onChange(anchor.role, {
                                                                order: Number(e.target.value) || 1,
                                                            })
                                                        }
                                                    />
                                                </FieldContent>
                                            </Field>

                                            {/* Internal signers are picked from staff; external
                                                ones are typed in, since they have no account. */}
                                            {isExternal ? (
                                                <>
                                                    <Field>
                                                        <FieldLabel>{t("attributes.name")}</FieldLabel>
                                                        <FieldContent>
                                                            <Input
                                                                disabled={disabled}
                                                                value={signer?.name ?? ""}
                                                                onChange={(e) =>
                                                                    onChange(anchor.role, {
                                                                        name: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </FieldContent>
                                                    </Field>
                                                    <Field>
                                                        <FieldLabel>
                                                            {t("attributes.email")}
                                                            <span className="text-destructive"> *</span>
                                                        </FieldLabel>
                                                        <FieldContent>
                                                            <Input
                                                                type="email"
                                                                dir="ltr"
                                                                disabled={disabled}
                                                                value={signer?.email ?? ""}
                                                                onChange={(e) =>
                                                                    onChange(anchor.role, {
                                                                        email: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </FieldContent>
                                                    </Field>
                                                </>
                                            ) : (
                                                <Field className="md:col-span-2">
                                                    <FieldLabel>{t("attributes.name")}</FieldLabel>
                                                    <FieldContent>
                                                        <Input
                                                            disabled={disabled}
                                                            value={signer?.name ?? ""}
                                                            onChange={(e) =>
                                                                onChange(anchor.role, {
                                                                    name: e.target.value,
                                                                })
                                                            }
                                                            placeholder={t("attributes.name")}
                                                        />
                                                    </FieldContent>
                                                </Field>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

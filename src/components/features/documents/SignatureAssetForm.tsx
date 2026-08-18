"use client";

import React, { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { useCan } from "@/providers/AbilityProvider";

import SignaturePad, { SignaturePadHandle } from "./signature/SignaturePad";
import { createSignatureAssetFromDataUri } from "@/actions/workspace/signature-assets.actions";

export default function SignatureAssetForm() {
    const t = useTranslations();
    const router = useRouter();
    const canApplyCompanyStamp = useCan("workspace.document.apply_company_stamp");

    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState("");
    const [type, setType] = useState<"signature" | "stamp">("signature");
    const [isCompany, setIsCompany] = useState(false);

    const padRef = useRef<SignaturePadHandle>(null);

    const submit = () => {
        if (!name.trim()) {
            toast.error(t("validation.name_required"));
            return;
        }

        const result = padRef.current?.getResult();
        if (!result) {
            toast.error(t("validation.signature_required"));
            return;
        }

        startTransition(async () => {
            const res = await createSignatureAssetFromDataUri({
                name: name.trim(),
                type,
                image_data: result.dataUrl,
                is_company: type === "stamp" && isCompany,
            });

            if (!res.success) {
                toast.error(res.error);
                return;
            }

            toast.success(res.message || t("success"));
            router.push("/documents/signatures");
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("messages.documents.create_new_asset")}</CardTitle>
            </CardHeader>
            <CardContent>
                <FieldGroup>
                    <Field>
                        <FieldLabel>{t("attributes.name")}</FieldLabel>
                        <FieldContent>
                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>{t("attributes.type")}</FieldLabel>
                        <FieldContent>
                            <Select
                                value={type}
                                onValueChange={(v) => {
                                    setType(v as "signature" | "stamp");
                                    if (v !== "stamp") setIsCompany(false);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="signature">
                                        {t("enums.documentAnchorType.signature")}
                                    </SelectItem>
                                    <SelectItem value="stamp">
                                        {t("enums.documentAnchorType.stamp")}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FieldContent>
                    </Field>

                    {type === "stamp" && canApplyCompanyStamp && (
                        <Field orientation="horizontal">
                            <Checkbox
                                checked={isCompany}
                                onCheckedChange={(c) => setIsCompany(Boolean(c))}
                            />
                            <FieldLabel className="font-normal">
                                {t("messages.documents.save_as_company_stamp")}
                            </FieldLabel>
                        </Field>
                    )}

                    <Field>
                        <FieldLabel>{t("attributes.image")}</FieldLabel>
                        <FieldContent>
                            <SignaturePad ref={padRef} />
                        </FieldContent>
                    </Field>
                </FieldGroup>

                <div className="mt-6 flex justify-end gap-2">
                    <Button type="button" variant="outline" render={<Link href="/documents/signatures" />} nativeButton={false}>
                        <X className="size-4" />
                        {t("buttons.cancel")}
                    </Button>
                    <Button type="button" onClick={submit} disabled={isPending} className="gap-2">
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        {t("buttons.save")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

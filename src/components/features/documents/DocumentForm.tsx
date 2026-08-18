"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Field,
    FieldContent,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSet,
} from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import DynamicFieldRenderer from "./DynamicFieldRenderer";
import SignerListEditor from "./SignerListEditor";
import {
    getDocumentTemplate,
    getDocumentTemplates,
    DocumentTemplateResource,
} from "@/actions/workspace/document-templates.actions";
import {
    createDocument,
    getDocument,
    updateDocument,
    DocumentData,
    DocumentResource,
    DocumentSignerData,
} from "@/actions/workspace/documents.actions";
import { getUserContractFields } from "@/actions/workspace/user.actions";

interface DocumentFormValues {
    title: string;
    expires_at: string;
    is_public_pdf: boolean;
    field_values: Record<string, any>;
}

export default function DocumentForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const documentId = (params?.id as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<DocumentTemplateResource[]>([]);
    const [template, setTemplate] = useState<DocumentTemplateResource | null>(null);
    const [signers, setSigners] = useState<Record<string, DocumentSignerData>>({});
    const [existing, setExisting] = useState<DocumentResource | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        watch,
        reset,
        formState: { errors },
    } = useForm<DocumentFormValues>({
        defaultValues: {
            title: "",
            expires_at: "",
            is_public_pdf: false,
            field_values: {},
        },
    });

    /** Seed one signer row per template anchor, defaulting to the anchor's side. */
    const seedSigners = useCallback(
        (tpl: DocumentTemplateResource, from?: DocumentResource | null) => {
            const seeded: Record<string, DocumentSignerData> = {};

            (tpl.anchors ?? []).forEach((anchor) => {
                const prior = from?.signers?.find((s) => s.role === anchor.role);
                const party = prior?.party.value ?? anchor.party.value;

                seeded[anchor.role] = {
                    role: anchor.role,
                    party,
                    order: prior?.order ?? (party === "external" ? 2 : 1),
                    name: prior?.name ?? "",
                    email: prior?.email ?? "",
                    user_id: prior?.user_id ?? null,
                };
            });

            setSigners(seeded);
        },
        [],
    );

    // Template list for the picker (only templates that are ready to use).
    useEffect(() => {
        const load = async () => {
            const res = await getDocumentTemplates("filter[status]=active&per_page=100");
            if (res.success) setTemplates(res.data.data);
            if (!documentId) setLoading(false);
        };
        load();
    }, [documentId]);

    // Edit mode: load the document, then its template so the field list and
    // anchor rows can be rebuilt.
    useEffect(() => {
        const load = async () => {
            if (!documentId) return;

            const res = await getDocument(documentId);
            if (!res.success) {
                toast.error(res.error);
                setLoading(false);
                return;
            }

            const doc = res.data;
            setExisting(doc);
            reset({
                title: doc.title,
                expires_at: doc.expires_at ? doc.expires_at.substring(0, 10) : "",
                is_public_pdf: doc.is_public_pdf,
                field_values: doc.field_values ?? {},
            });

            if (doc.document_template_id) {
                const tpl = await getDocumentTemplate(doc.document_template_id);
                if (tpl.success) {
                    setTemplate(tpl.data);
                    seedSigners(tpl.data, doc);
                }
            }

            setLoading(false);
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [documentId]);

    const handleTemplateChange = (id: string) => {
        startTransition(async () => {
            const res = await getDocumentTemplate(id);
            if (!res.success) {
                toast.error(res.error);
                return;
            }

            setTemplate(res.data);
            seedSigners(res.data);

            // Prefill any defaults the template author configured.
            const defaults: Record<string, any> = {};
            (res.data.fields ?? []).forEach((f) => {
                if (f.default_value) defaults[f.key] = f.default_value;
            });
            setValue("field_values", defaults);
        });
    };

    // Once an `employee`-type field is filled in, pull that employee's
    // Profile data and merge it into any other field on the template whose
    // key matches one of ContractAutoFiller's keys (e.g. employee_full_name)
    // — without touching fields the user already typed something into, and
    // without re-fetching every render (guarded by the ref below).
    const lastAutoFilledEmployeeId = React.useRef<Record<string, string>>({});
    const employeeFieldKeys = useMemo(
        () => (template?.fields ?? []).filter((f) => f.type.value === "employee").map((f) => f.key),
        [template],
    );
    const watchedFieldValues = watch("field_values");

    useEffect(() => {
        if (employeeFieldKeys.length === 0) return;

        employeeFieldKeys.forEach((key) => {
            const userId = watchedFieldValues?.[key];
            if (!userId || lastAutoFilledEmployeeId.current[key] === userId) return;
            lastAutoFilledEmployeeId.current[key] = userId;

            getUserContractFields(userId).then((res) => {
                if (!res.success) return;

                const templateKeys = new Set((template?.fields ?? []).map((f) => f.key));
                const current = watchedFieldValues ?? {};
                const merged = { ...current };

                Object.entries(res.data).forEach(([contractKey, value]) => {
                    if (templateKeys.has(contractKey) && !current[contractKey]) {
                        merged[contractKey] = value;
                    }
                });

                setValue("field_values", merged);
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedFieldValues, employeeFieldKeys]);

    const handleSignerChange = (role: string, patch: Partial<DocumentSignerData>) => {
        setSigners((prev) => ({ ...prev, [role]: { ...prev[role], ...patch } }));
    };

    const onSubmit = (values: DocumentFormValues) => {
        if (!template) {
            toast.error(t("messages.documents.pick_template_first"));
            return;
        }

        startTransition(async () => {
            const payload: DocumentData = {
                document_template_id: template.id,
                title: values.title,
                field_values: values.field_values ?? {},
                expires_at: values.expires_at || null,
                is_public_pdf: values.is_public_pdf,
                signers: Object.values(signers),
            };

            const res = documentId
                ? await updateDocument(documentId, payload)
                : await createDocument(payload);

            if (!res.success) {
                toast.error(res.error);
                return;
            }

            toast.success(res.message || t("success"));
            router.push(`/documents/issued/${res.data.id}`);
        });
    };

    const templateOptions = useMemo(
        () => templates.map((tpl) => ({ value: String(tpl.id), label: tpl.name })),
        [templates],
    );

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    // A document that has left draft is what its signers are agreeing to, so
    // the backend refuses edits — reflect that rather than letting the user
    // fill in a form that cannot be saved.
    if (existing && !existing.is_editable) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{existing.title}</CardTitle>
                    <CardDescription>{t("messages.documents.not_editable")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href={`/documents/issued/${existing.id}`}>
                        <Button type="button">{t("routes.document_details")}</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Card>
                <CardHeader>
                    <CardTitle>
                        {documentId ? t("routes.edit_document") : t("routes.create_document")}
                    </CardTitle>
                    <CardDescription>{t("messages.documents.form_description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <FieldSet>
                        <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                            <Field>
                                <FieldLabel>{t("attributes.template")}</FieldLabel>
                                <FieldContent>
                                    <Select
                                        value={template ? String(template.id) : ""}
                                        disabled={isPending || !!documentId}
                                        onValueChange={(v) => v && handleTemplateChange(v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue>
                                                {template?.name ?? t("messages.documents.pick_template")}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templateOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>{t("attributes.title")}</FieldLabel>
                                <FieldContent>
                                    <Input
                                        {...register("title", { required: "validation.required" })}
                                        placeholder={t("attributes.title")}
                                    />
                                    {errors.title && (
                                        <FieldError>{t(errors.title.message!)}</FieldError>
                                    )}
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>{t("attributes.expires_at")}</FieldLabel>
                                <FieldContent>
                                    <Input type="date" dir="ltr" {...register("expires_at")} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldContent>
                                    <Controller
                                        name="is_public_pdf"
                                        control={control}
                                        render={({ field }) => (
                                            <label className="flex items-start gap-2 text-sm">
                                                <Checkbox
                                                    checked={Boolean(field.value)}
                                                    onCheckedChange={(c) => field.onChange(Boolean(c))}
                                                />
                                                <span>
                                                    {t("messages.documents.public_pdf_label")}
                                                    <span className="block text-muted-foreground">
                                                        {t("messages.documents.public_pdf_hint")}
                                                    </span>
                                                </span>
                                            </label>
                                        )}
                                    />
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </FieldSet>
                </CardContent>
            </Card>

            {template && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                {t("messages.documents.step_fields")}
                            </CardTitle>
                            <CardDescription>
                                {t("messages.documents.step_fields_hint")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(template.fields ?? []).length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t("messages.documents.no_fields_in_template")}
                                </p>
                            ) : (
                                <FieldSet>
                                    <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                        {(template.fields ?? []).map((field) => (
                                            <DynamicFieldRenderer
                                                key={field.key}
                                                field={field}
                                                control={control}
                                                disabled={isPending}
                                                error={
                                                    (errors.field_values as any)?.[field.key]?.message
                                                }
                                            />
                                        ))}
                                    </FieldGroup>
                                </FieldSet>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                {t("messages.documents.step_signers")}
                            </CardTitle>
                            <CardDescription>
                                {t("messages.documents.step_signers_hint")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SignerListEditor
                                anchors={template.anchors ?? []}
                                signers={signers}
                                disabled={isPending}
                                onChange={handleSignerChange}
                            />
                        </CardContent>
                    </Card>
                </>
            )}

            <div className="flex justify-end gap-3">
                <Link href="/documents/issued">
                    <Button type="button" variant="outline" disabled={isPending} className="gap-2">
                        <X className="size-4" />
                        {t("buttons.cancel")}
                    </Button>
                </Link>
                <Button type="submit" disabled={isPending || !template} className="gap-2">
                    {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Save className="size-4" />
                    )}
                    {t("buttons.save")}
                </Button>
            </div>
        </form>
    );
}

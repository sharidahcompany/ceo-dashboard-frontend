"use client";

import React, { useEffect, useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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

import TemplateEditor from "./TemplateEditor";
import TemplateFieldsPanel from "./TemplateFieldsPanel";
import {
    createDocumentTemplate,
    getDocumentTemplate,
    updateDocumentTemplate,
    updateDocumentTemplateFields,
    DocumentTemplateAnchorResource,
    DocumentTemplateData,
    DocumentTemplateFieldResource,
    DocumentTemplateResource,
} from "@/actions/workspace/document-templates.actions";

interface TemplateFormValues {
    name: string;
    description: string;
    category: string;
    status: string;
    page_size: string;
    orientation: string;
}

const STATUSES = ["draft", "active", "archived"] as const;
const PAGE_SIZES = ["A4", "A5", "Letter", "Legal"] as const;
const ORIENTATIONS = ["portrait", "landscape"] as const;

export default function DocumentTemplateForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const templateId = (params?.id as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!templateId);
    const [bodyHtml, setBodyHtml] = useState("");
    const [fields, setFields] = useState<DocumentTemplateFieldResource[]>([]);
    const [anchors, setAnchors] = useState<DocumentTemplateAnchorResource[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<TemplateFormValues>({
        defaultValues: {
            name: "",
            description: "",
            category: "",
            status: "draft",
            page_size: "A4",
            orientation: "portrait",
        },
    });

    const hydrate = (template: DocumentTemplateResource) => {
        setValue("name", template.name || "");
        setValue("description", template.description || "");
        setValue("category", template.category || "");
        setValue("status", template.status?.value || "draft");
        setValue("page_size", template.page_size || "A4");
        setValue("orientation", template.orientation || "portrait");
        setBodyHtml(template.body_html || "");
        setFields(template.fields ?? []);
        setAnchors(template.anchors ?? []);
    };

    useEffect(() => {
        const load = async () => {
            if (!templateId) return;
            const res = await getDocumentTemplate(templateId);
            if (res.success) {
                hydrate(res.data);
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateId]);

    const handleFieldChange = (
        key: string,
        patch: Partial<DocumentTemplateFieldResource>,
    ) => {
        setFields((prev) =>
            prev.map((field) => (field.key === key ? { ...field, ...patch } : field)),
        );
    };

    const handleAnchorChange = (
        type: string,
        role: string,
        patch: Partial<DocumentTemplateAnchorResource>,
    ) => {
        setAnchors((prev) =>
            prev.map((anchor) =>
                anchor.type.value === type && anchor.role === role
                    ? { ...anchor, ...patch }
                    : anchor,
            ),
        );
    };

    const onSubmit = (values: TemplateFormValues) => {
        startTransition(async () => {
            const payload: DocumentTemplateData = {
                name: values.name,
                description: values.description || null,
                category: values.category || null,
                status: values.status,
                page_size: values.page_size,
                orientation: values.orientation,
                body_html: bodyHtml,
            };

            const res = templateId
                ? await updateDocumentTemplate(templateId, payload)
                : await createDocumentTemplate(payload);

            if (!res.success) {
                // Malformed or split tokens come back as a 422 naming the
                // offending token, so surfacing the message verbatim is the
                // most useful thing we can do.
                toast.error(res.error);
                return;
            }

            // The side panel is a second endpoint because keys and roles are
            // derived from the body: the body has to be saved and re-parsed
            // before there is anything to attach this metadata to.
            const saved = res.data;
            const metadata = await updateDocumentTemplateFields(saved.id, {
                fields: fields.map((f) => ({
                    key: f.key,
                    label: f.label,
                    type: f.type.value,
                    required: f.required,
                    default_value: f.default_value ?? null,
                    options: f.options ?? null,
                })),
                anchors: anchors.map((a) => ({
                    type: a.type.value,
                    role: a.role,
                    party: a.party.value,
                    required: a.required,
                })),
            });

            if (metadata.success) {
                hydrate(metadata.data);
            } else {
                hydrate(saved);
            }

            toast.success(res.message || t("success"));

            if (!templateId) {
                router.push(`/documents/templates/edit/${saved.id}`);
            }
        });
    };

    if (loadingData) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Card>
                <CardHeader>
                    <CardTitle>
                        {templateId
                            ? t("routes.edit_document_template")
                            : t("routes.create_document_template")}
                    </CardTitle>
                    <CardDescription>
                        {t("messages.document_templates.form_description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FieldSet>
                        <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                            <Field>
                                <FieldLabel>{t("attributes.name")}</FieldLabel>
                                <FieldContent>
                                    <Input
                                        {...register("name", { required: "validation.required" })}
                                        placeholder={t("attributes.name")}
                                    />
                                    {errors.name && <FieldError>{t(errors.name.message!)}</FieldError>}
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>{t("attributes.category")}</FieldLabel>
                                <FieldContent>
                                    <Input
                                        {...register("category")}
                                        placeholder={t("attributes.category")}
                                    />
                                </FieldContent>
                            </Field>

                            <Field className="md:col-span-2">
                                <FieldLabel>{t("attributes.description")}</FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        {...register("description")}
                                        rows={2}
                                        placeholder={t("attributes.description")}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>{t("attributes.status")}</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={(v) => v && field.onChange(v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue>
                                                        {t(`enums.documentTemplateStatus.${field.value}`)}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUSES.map((status) => (
                                                        <SelectItem key={status} value={status}>
                                                            {t(`enums.documentTemplateStatus.${status}`)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>{t("attributes.page_size")}</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        name="page_size"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={(v) => v && field.onChange(v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue>{field.value}</SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PAGE_SIZES.map((size) => (
                                                        <SelectItem key={size} value={size}>
                                                            {size}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>{t("attributes.orientation")}</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        name="orientation"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={(v) => v && field.onChange(v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue>
                                                        {t(`enums.orientation.${field.value}`)}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ORIENTATIONS.map((o) => (
                                                        <SelectItem key={o} value={o}>
                                                            {t(`enums.orientation.${o}`)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </FieldSet>
                </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">{t("attributes.body")}</CardTitle>
                        <CardDescription>
                            {t("messages.document_templates.body_description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TemplateEditor value={bodyHtml} onChange={setBodyHtml} />
                    </CardContent>
                </Card>

                <div>
                    <TemplateFieldsPanel
                        fields={fields}
                        anchors={anchors}
                        disabled={isPending}
                        onFieldChange={handleFieldChange}
                        onAnchorChange={handleAnchorChange}
                    />
                    {!templateId && (
                        <p className="mt-3 text-sm text-muted-foreground">
                            {t("messages.document_templates.save_to_detect")}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Link href="/documents/templates">
                    <Button type="button" variant="outline" disabled={isPending} className="gap-2">
                        <X className="size-4" />
                        {t("buttons.cancel")}
                    </Button>
                </Link>
                <Button type="submit" disabled={isPending} className="gap-2">
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

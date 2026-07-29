"use client";

import React, { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { createPage, updatePage, PageResource, PageFormData } from "@/actions/website/pages.actions";
import { toast } from "sonner";

import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ direction: "rtl" }, { align: [] }],
        ["link", "clean"],
    ],
};

// Zod Schema matching Laravel Form Request rules
const pageFormSchema = z.object({
    slug: z.string().min(1, "validation.required").regex(/^[a-z0-9-]+$/, {
        message: "validation.invalid_slug_format"
    }),
    title: z.record(z.string(), z.string().min(1, "validation.required")),
    description: z.record(z.string(), z.string().min(1, "validation.required")),
    keywords: z.record(z.string(), z.string().min(1, "validation.required")),
    is_published: z.boolean(),
});

interface PagesFormProps {
    initialData?: PageResource;
}

type PageFormInput = {
    title: Record<string, string>;
    slug: string;
    description: Record<string, string>;
    keywords: Record<string, string>;
    is_published: boolean;
};

export default function PagesForm({ initialData }: PagesFormProps) {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const isRtl = params?.locale === "ar";
    const [isPending, startTransition] = useTransition();

    // Default Form values
    const defaultValues: PageFormInput = {
        slug: initialData?.slug || "",
        title: {
            en: initialData?.title?.en || "",
            ar: initialData?.title?.ar || "",
        },
        description: {
            en: initialData?.description?.en || "",
            ar: initialData?.description?.ar || "",
        },
        keywords: {
            en: initialData?.keywords?.en || "",
            ar: initialData?.keywords?.ar || "",
        },
        is_published: !!initialData?.is_published,
    };

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<PageFormInput>({
        resolver: zodResolver(pageFormSchema),
        defaultValues,
    });

    const onSubmit = (data: PageFormInput) => {
        startTransition(async () => {
            const payload: PageFormData = {
                slug: data.slug,
                title: data.title,
                description: data.description,
                keywords: data.keywords,
                is_published: data.is_published ? 1 : 0,
            };

            let response;
            if (initialData?.id) {
                response = await updatePage(initialData.id, payload);
            } else {
                response = await createPage(payload);
            }

            if (response.success) {
                toast.success(t("messages.success", { defaultValue: "Saved successfully!" }));
                router.push(`/${params.locale}/website/pages`);
            } else {
                toast.error(response.error || t("errors.something_went_wrong"));
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area: Multilingual inputs */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className={isRtl ? "text-right" : "text-left"}>
                            <CardTitle>{t("pages.content_title", { defaultValue: "Page Content" })}</CardTitle>
                            <CardDescription>
                                {t("pages.content_description", { defaultValue: "Enter page title and description in both Arabic and English." })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="en" className="w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <TabsList variant="default">
                                        <TabsTrigger value="en">English</TabsTrigger>
                                        <TabsTrigger value="ar">العربية</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="en" className="space-y-4 pt-2 text-left" dir="rtl">
                                    <Field  >
                                        <FieldLabel className="justify-start">{t("attributes.title_en", { defaultValue: "Title (English)" })}</FieldLabel>
                                        <Input
                                            {...register("title.en", { required: true })}
                                            placeholder="Enter English Title"
                                            className="text-left"
                                            dir="ltr"
                                        />
                                        {errors.title?.en && <FieldError className="text-left">{t("validation.required")}</FieldError>}
                                    </Field>

                                    <Field>
                                        <FieldLabel className="justify-start">{t("attributes.description_en", { defaultValue: "Description (English)" })}</FieldLabel>
                                        <Controller
                                            name="description.en"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="bg-background rounded-md [&_.ql-editor]:min-h-[180px] [&_.ql-container]:rounded-b-md [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:border-input [&_.ql-toolbar]:border-input text-left" dir="ltr">
                                                    <ReactQuill
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        modules={quillModules}
                                                        theme="snow"
                                                        placeholder="Enter English Description"
                                                        className="text-left"
                                                    />
                                                </div>
                                            )}
                                        />
                                        {errors.description?.en && <FieldError className="text-left">{t("validation.required")}</FieldError>}
                                    </Field>

                                    <Field >
                                        <FieldLabel className="justify-start">{t("attributes.keywords_en", { defaultValue: "Keywords (English)" })}</FieldLabel>
                                        <Input
                                            {...register("keywords.en", { required: true })}
                                            placeholder="comma, separated, keywords"
                                            className="text-left"
                                            dir="ltr"
                                        />
                                        <FieldDescription className="text-left">
                                            {t("pages.keywords_helper", { defaultValue: "Separate keywords with commas." })}
                                        </FieldDescription>
                                        {errors.keywords?.en && <FieldError className="text-left">{t("validation.required")}</FieldError>}
                                    </Field>
                                </TabsContent>

                                <TabsContent value="ar" className="space-y-4 pt-2  " dir="rtl">
                                    <Field  >
                                        <FieldLabel className="w-full " dir="rtl">
                                            {t("attributes.title_ar", { defaultValue: "العنوان (العربية)" })}
                                        </FieldLabel>
                                        <Input
                                            {...register("title.ar", { required: true })}
                                            placeholder="أدخل العنوان باللغة العربية"
                                        />
                                        {errors.title?.ar && <FieldError className="text-right">{t("validation.required")}</FieldError>}
                                    </Field>

                                    <Field className="text-right" dir="rtl">
                                        <FieldLabel className="w-full " dir="rtl">
                                            {t("attributes.description_ar", { defaultValue: "الوصف (العربية)" })}
                                        </FieldLabel>
                                        <Controller
                                            name="description.ar"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="bg-background rounded-md [&_.ql-editor]:min-h-[180px] [&_.ql-container]:rounded-b-md [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:border-input [&_.ql-toolbar]:border-input text-right ql-rtl [&_.ql-editor.ql-blank::before]:right-4 [&_.ql-editor.ql-blank::before]:left-auto [&_.ql-editor.ql-blank::before]:[direction:rtl] [&_.ql-editor.ql-blank::before]:text-right" dir="rtl">
                                                    <ReactQuill
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        modules={quillModules}
                                                        theme="snow"
                                                        placeholder="أدخل الوصف باللغة العربية"
                                                        className="text-right ql-rtl"
                                                    />
                                                </div>
                                            )}
                                        />
                                        {errors.description?.ar && <FieldError className="text-right">{t("validation.required")}</FieldError>}
                                    </Field>

                                    <Field className="text-right" dir="rtl">
                                        <FieldLabel className="w-full  " dir="rtl">
                                            {t("attributes.keywords_ar", { defaultValue: "الكلمات الدلالية (العربية)" })}
                                        </FieldLabel>
                                        <Input
                                            {...register("keywords.ar", { required: true })}
                                            placeholder="كلمات, دلالية, مفصولة, بفاصلة"
                                            className="text-right"
                                            dir="rtl"
                                        />
                                        <FieldDescription className="text-right">
                                            {t("pages.keywords_helper_ar", { defaultValue: "افصل بين الكلمات الدلالية بفواصل." })}
                                        </FieldDescription>
                                        {errors.keywords?.ar && <FieldError className="text-right">{t("validation.required")}</FieldError>}
                                    </Field>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Config: Slug & Publishing */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className={isRtl ? "text-right" : "text-left"}>
                            <CardTitle>{t("pages.settings_title", { defaultValue: "Settings" })}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Field>
                                <FieldLabel>{t("attributes.slug", { defaultValue: "Slug" })}</FieldLabel>
                                <Input
                                    {...register("slug", { required: true, pattern: /^[a-z0-9-]+$/ })}
                                    placeholder="page-slug"
                                    className="text-left font-mono"
                                    dir="ltr"
                                />
                                <FieldDescription>
                                    {t("pages.slug_helper", { defaultValue: "Only lowercase letters, numbers, and dashes are allowed." })}
                                </FieldDescription>
                                {errors.slug && <FieldError>{t("validation.invalid_subdomain", { defaultValue: "Invalid slug format" })}</FieldError>}
                            </Field>

                            <Controller
                                name="is_published"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex items-center gap-3 py-2">
                                        <Checkbox
                                            id="is_published"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                        <Label htmlFor="is_published" className="text-sm font-medium leading-none cursor-pointer">
                                            {t("pages.publish_label", { defaultValue: "Publish Immediately" })}
                                        </Label>
                                    </div>
                                )}
                            />

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={isPending}
                                >
                                    {isPending ? t("buttons.saving", { defaultValue: "Saving..." }) : t("buttons.save", { defaultValue: "Save" })}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push(`/${params.locale}/website/pages`)}
                                    disabled={isPending}
                                >
                                    {t("buttons.cancel", { defaultValue: "Cancel" })}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}

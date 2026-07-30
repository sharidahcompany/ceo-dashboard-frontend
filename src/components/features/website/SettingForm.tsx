"use client";

import { z } from "zod";
import {
    showSettings,
    storeSettings,
    WebsiteSettingResource,
} from "@/actions/website/setting.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldSeparator, FieldSet } from "@/components/ui/field";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Palette, Link as LinkIcon, Image as ImageIcon, Save, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export const websiteSettingSchema = z.object({
    title: z.object({
        en: z.string().max(255).nullable().optional(),
        ar: z.string().max(255).nullable().optional(),
    }),
    description: z.object({
        en: z.string().nullable().optional(),
        ar: z.string().nullable().optional(),
    }),

    keywords: z.array(z.string()).nullable().optional(),

    phone: z.string().nullable().optional(),
    email: z.string().min(1, 'validation.required').pipe(z.email('validation.email')).nullable().optional().or(z.literal("")),

    primary_color: z.string().max(20).nullable().optional(),
    dark_mode_color: z.string().max(20).nullable().optional(),

    enable_dark_mode: z.boolean().default(true),
    enable_localization: z.boolean().default(true),
    maintenance_mode: z.boolean().default(false),

    appstore_link: z.string().max(255).nullable().optional().or(z.literal("")),
    playstore_link: z.string().max(255).nullable().optional().or(z.literal("")),

    logo: z
        .union([
            z.instanceof(File).refine((file) => file.size <= 2 * 1024 * 1024, "Max file size is 2MB"),
            z.string(),
        ])
        .nullable()
        .optional(),

    favicon: z
        .union([
            z.instanceof(File).refine((file) => file.size <= 512 * 1024, "Max file size is 512KB"),
            z.string(),
        ])
        .nullable()
        .optional(),
});

export type WebsiteSettingFormData = z.infer<typeof websiteSettingSchema>;

export default function SettingForm() {
    const t = useTranslations();
    const [keywordInput, setKeywordInput] = React.useState("");
    const [isLoadingData, setIsLoadingData] = React.useState(true);

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(websiteSettingSchema) as any,
        defaultValues: {
            title: { ar: "", en: "" },
            description: { ar: "", en: "" },
            keywords: [],
            phone: "",
            email: "",
            primary_color: "#3b82f6",
            dark_mode_color: "#1e293b",
            enable_dark_mode: true,
            enable_localization: true,
            maintenance_mode: false,
            appstore_link: "",
            playstore_link: "",
            logo: null,
            favicon: null,
        },
    });

    const primaryColor = watch("primary_color");
    const darkModeColor = watch("dark_mode_color");

    React.useEffect(() => {
        const loadSettings = async () => {
            const result = await showSettings();
            if (!result.success) {
                toast.error(result.error);
                setIsLoadingData(false);
                return;
            }
            const data = result.data.data;

            if (data) {
                setValue("title.ar", data.title?.ar || "");
                setValue("title.en", data.title?.en || "");
                setValue("description.ar", data.description?.ar || "");
                setValue("description.en", data.description?.en || "");
                setValue("keywords", data.keywords || []);
                setValue("phone", data.phone || "");
                setValue("email", data.email || "");
                setValue("primary_color", data.primary_color || "#3b82f6");
                setValue("dark_mode_color", data.dark_mode_color || "#1e293b");
                setValue("enable_dark_mode", data.enable_dark_mode ?? true);
                setValue("enable_localization", data.enable_localization ?? true);
                setValue("maintenance_mode", data.maintenance_mode ?? false);
                setValue("appstore_link", data.appstore_link || "");
                setValue("playstore_link", data.playstore_link || "");
                setValue("logo", data.logo_url || null);
                setValue("favicon", data.favicon_url || null);
            }
            setIsLoadingData(false);
        };
        loadSettings();
    }, [setValue]);

    const [isPending, startTransition] = React.useTransition();
    const errs = errors as any;
    const keywords = watch("keywords") || [];

    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spinner />
            </div>
        );
    }

    const handleAddKeyword = () => {
        const trimmed = keywordInput.trim();
        if (trimmed && !keywords.includes(trimmed)) {
            setValue("keywords", [...keywords, trimmed], { shouldDirty: true });
            setKeywordInput("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddKeyword();
        }
    }; const handleRemoveKeyword = (indexToRemove: number) => {
        setValue(
            "keywords",
            keywords.filter((_: string, i: number) => i !== indexToRemove),
            { shouldDirty: true }
        );
    };
    const handleSave = (data: any) => {
        startTransition(async () => {
            const formData = new FormData();
            if (data.title?.ar) formData.append("title[ar]", data.title.ar);
            if (data.title?.en) formData.append("title[en]", data.title.en);
            if (data.description?.ar) formData.append("description[ar]", data.description.ar);
            if (data.description?.en) formData.append("description[en]", data.description.en);

            if (data.keywords && data.keywords.length > 0) {
                data.keywords.forEach((keyword: string, index: number) => {
                    formData.append(`keywords[${index}]`, keyword);
                });
            }
            formData.append("phone", data.phone || "");
            formData.append("email", data.email || "");
            formData.append("primary_color", data.primary_color || "");
            formData.append("dark_mode_color", data.dark_mode_color || "");
            formData.append("enable_dark_mode", data.enable_dark_mode ? "1" : "0");
            formData.append("enable_localization", data.enable_localization ? "1" : "0");
            formData.append("maintenance_mode", data.maintenance_mode ? "1" : "0");
            formData.append("appstore_link", data.appstore_link || "");
            formData.append("playstore_link", data.playstore_link || "");

            if (data.logo instanceof File) {
                formData.append("logo", data.logo);
            }
            if (data.favicon instanceof File) {
                formData.append("favicon", data.favicon);
            }

            const result = await storeSettings(formData);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success(t("messages.website_settings.update_success"));
        });
    };

    return (
        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
            <FieldSet>
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="mb-6 flex gap-2 border-b border-input pb-px" variant="line">
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            {t("messages.website_settings.general_settings")}
                        </TabsTrigger>
                        <TabsTrigger value="design" className="flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            {t("messages.website_settings.design_settings")}
                        </TabsTrigger>
                        <TabsTrigger value="links" className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            {t("messages.website_settings.links_settings")}
                        </TabsTrigger>
                        <TabsTrigger value="media" className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            {t("messages.website_settings.media_settings")}
                        </TabsTrigger>
                    </TabsList>

                    {/* General Settings Tab */}
                    <TabsContent value="general" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field>
                                <Label>{t("attributes.title_ar")}</Label>
                                <Input {...register("title.ar")} placeholder={t("attributes.title_ar")} />
                                {errs?.title?.ar && <FieldError>{t(errs.title.ar.message!)}</FieldError>}
                            </Field>

                            <Field>
                                <Label>{t("attributes.title_en")}</Label>
                                <Input {...register("title.en")} placeholder={t("attributes.title_en")} />
                                {errs?.title?.en && <FieldError>{t(errs.title.en.message!)}</FieldError>}
                            </Field>

                            <Field className="md:col-span-2">
                                <Label>{t("attributes.description_ar")}</Label>
                                <Textarea {...register("description.ar")} placeholder={t("attributes.description_ar")} />
                                {errs?.description?.ar && <FieldError>{t(errs.description.ar.message!)}</FieldError>}
                            </Field>

                            <Field className="md:col-span-2">
                                <Label>{t("attributes.description_en")}</Label>
                                <Textarea {...register("description.en")} placeholder={t("attributes.description_en")} />
                                {errs?.description?.en && <FieldError>{t(errs.description.en.message!)}</FieldError>}
                            </Field>

                            <Field className="md:col-span-2">
                                <Label>{t("attributes.keywords")}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={t("attributes.keywords")}
                                    />
                                    <Button type="button" onClick={handleAddKeyword} variant="outline">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2 min-h-6">
                                    <AnimatePresence>
                                        {keywords.map((word: string, idx: number) => (
                                            <motion.div
                                                key={word}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <Badge className="flex items-center gap-1 bg-muted text-foreground hover:bg-muted/80">
                                                    {word}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveKeyword(idx)}
                                                        className="hover:text-destructive focus:outline-none"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </Field>

                            <Field>
                                <Label>{t("attributes.phone")}</Label>
                                <Input {...register("phone")} placeholder={t("attributes.phone")} />
                                {errs?.phone && <FieldError>{t(errs.phone.message!)}</FieldError>}
                            </Field>

                            <Field>
                                <Label>{t("attributes.email")}</Label>
                                <Input {...register("email")} placeholder={t("attributes.email")} />
                                {errs?.email && <FieldError>{t(errs.email.message!)}</FieldError>}
                            </Field>

                            <div className="flex flex-wrap gap-6 md:col-span-2 pt-2">
                                <Controller
                                    name="enable_localization"
                                    control={control}
                                    render={({ field }) => (
                                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                            <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                                            <span>{t("attributes.enable_localization")}</span>
                                        </label>
                                    )}
                                />
                                <Controller
                                    name="maintenance_mode"
                                    control={control}
                                    render={({ field }) => (
                                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                            <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                                            <span>{t("attributes.maintenance_mode")}</span>
                                        </label>
                                    )}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Design Settings Tab */}
                    <TabsContent value="design" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field>
                                <Label>{t("attributes.primary_color")}</Label>
                                <div className="flex gap-3 items-center">
                                    <Input
                                        type="color"
                                        className="w-12 h-10 p-0.5 border cursor-pointer rounded-md bg-transparent"
                                        value={primaryColor || "#3b82f6"}
                                        onChange={(e) => setValue("primary_color", e.target.value)}
                                    />
                                    <Input {...register("primary_color")} placeholder="#3b82f6" />
                                </div>
                                {errs?.primary_color && <FieldError>{t(errs.primary_color.message!)}</FieldError>}
                            </Field>

                            <Field>
                                <Label>{t("attributes.dark_mode_color")}</Label>
                                <div className="flex gap-3 items-center">
                                    <Input
                                        type="color"
                                        className="w-12 h-10 p-0.5 border cursor-pointer rounded-md bg-transparent"
                                        value={darkModeColor || "#1e293b"}
                                        onChange={(e) => setValue("dark_mode_color", e.target.value)}
                                    />
                                    <Input {...register("dark_mode_color")} placeholder="#1e293b" />
                                </div>
                                {errs?.dark_mode_color && <FieldError>{t(errs.dark_mode_color.message!)}</FieldError>}
                            </Field>

                            <div className="pt-2 md:col-span-2">
                                <Controller
                                    name="enable_dark_mode"
                                    control={control}
                                    render={({ field }) => (
                                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                            <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                                            <span>{t("attributes.enable_dark_mode")}</span>
                                        </label>
                                    )}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Store Links Tab */}
                    <TabsContent value="links" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field>
                                <Label>{t("attributes.appstore_link")}</Label>
                                <Input dir="ltr" {...register("appstore_link")} placeholder="https://apps.apple.com/..." />
                                {errs?.appstore_link && <FieldError>{t(errs.appstore_link.message!)}</FieldError>}
                            </Field>

                            <Field>
                                <Label>{t("attributes.playstore_link")}</Label>
                                <Input dir="ltr" {...register("playstore_link")} placeholder="https://play.google.com/..." />
                                {errs?.playstore_link && <FieldError>{t(errs.playstore_link.message!)}</FieldError>}
                            </Field>
                        </div>
                    </TabsContent>

                    {/* Logo & Favicon Tab */}
                    <TabsContent value="media" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field>
                                <Label>{t("attributes.logo")}</Label>
                                <FileUpload
                                    name="logo"
                                    control={control as any}
                                    initialUrl={typeof watch("logo") === "string" ? (watch("logo") as string) : undefined}
                                />
                                {errs?.logo && <FieldError>{errs.logo.message}</FieldError>}
                            </Field>

                            <Field>
                                <Label>{t("attributes.favicon")}</Label>
                                <FileUpload
                                    name="favicon"
                                    control={control as any}
                                    initialUrl={typeof watch("favicon") === "string" ? (watch("favicon") as string) : undefined}
                                />
                                {errs?.favicon && <FieldError>{errs.favicon.message}</FieldError>}
                            </Field>
                        </div>
                    </TabsContent>
                </Tabs>

                <FieldSeparator className="my-6" />

                <FieldGroup>
                    <Button type="submit" disabled={isPending} className="w-fit flex items-center gap-2">
                        {isPending ? <Spinner /> : <Save className="w-4 h-4" />}
                        {t("messages.website_settings.save_settings")}
                    </Button>
                </FieldGroup>
            </FieldSet>
        </form>
    );
}
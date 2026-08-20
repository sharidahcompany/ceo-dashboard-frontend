"use client";

import React, { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldSet } from "@/components/ui/field";
import { Input, NumericInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import {
    createSection,
    updateSection,
    uploadSectionMedia,
    SectionResource,
} from "@/actions/website/customiztion.actions";
import { SECTION_TYPES, isFixedSectionType } from "./section-types";


// Convert a free text value into a URL friendly slug
const slugify = (value: string) =>
    value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, "-")
        .replace(/[^\p{L}\p{N}-]+/gu, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const sectionSchema = z.object({
    order: z.coerce.number().int().min(0, "validation.min_value"),
    type: z.string().min(1, "validation.required"),
    contentRaw: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    imageFile: z.any().optional(),
    imageUrl: z.string().optional(),
    text_alignment: z.enum(["left", "center", "right"]).optional(),
    layout: z.enum([
        "text-left-image-right",
        "text-right-image-left",
        "text-top-image-bottom",
        "text-bottom-image-top",
    ]).optional(),
    items: z.array(z.object({
        title: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        caption: z.string().optional(),
        imageFile: z.any().optional(),
        imageUrl: z.string().optional(),
    })).optional(),
    slides_per_view_tablet: z.coerce.number().optional(),
    slides_per_view_desktop: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
    const isCustomRawJsonType = !["section", "carousel", "features", "header", "navbar", "products", "vision", "goals", "branches_map", "footer", "plans"].includes(data.type);

    if (data.type === "features" && data.items) {
        const seen = new Map<string, number>();
        data.items.forEach((item, index) => {
            const slug = (item.slug || item.title || "").trim().toLowerCase();
            if (!slug) return;
            if (seen.has(slug)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["items", index, "slug"],
                    message: "validation.duplicate_slug",
                });
            } else {
                seen.set(slug, index);
            }
        });
    }

    if (isCustomRawJsonType) {
        if (!data.contentRaw) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["contentRaw"],
                message: "validation.required",
            });
        } else {
            try {
                JSON.parse(data.contentRaw);
            } catch {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["contentRaw"],
                    message: "validation.invalid_json",
                });
            }
        }
    }
});

type SectionFormValues = z.infer<typeof sectionSchema>;

interface SectionFormProps {
    initialData?: SectionResource;
    onSuccess: () => void;
}

export default function SectionForm({ initialData, onSuccess }: SectionFormProps) {
    const t = useTranslations();
    const [isPending, startTransition] = useTransition();

    // Default structure helper based on selected type
    const getDefaultContentForType = (type: string) => {
        switch (type) {
            case "navbar":
            case "footer":
            case "products":
            case "vision":
            case "goals":
            case "branches_map":
            case "plans":
                return {};
            case "carousel":
                return { items: [{ image: "", caption: "Slide 1" }, { image: "", caption: "Slide 2" }] };
            default:
                return { title: "", description: "" };
        }
    };

    const {
        register,
        handleSubmit,
        control,
        setValue,
        getValues,
        watch,
        formState: { errors },
    } = useForm<SectionFormValues>({
        resolver: zodResolver(sectionSchema) as any,
        defaultValues: {
            order: initialData?.order ?? 0,
            type: initialData?.type ?? "section",
            contentRaw: initialData?.type !== "section" && initialData?.type !== "carousel" && initialData?.type !== "features" && initialData?.type !== "header" && initialData?.content ? JSON.stringify(initialData.content, null, 2) : "",
            title: (initialData?.type === "section" || initialData?.type === "carousel" || initialData?.type === "features" || initialData?.type === "header") ? initialData.content?.title ?? "" : "",
            description: (initialData?.type === "section" || initialData?.type === "carousel" || initialData?.type === "features" || initialData?.type === "header") ? initialData.content?.description ?? "" : "",
            imageUrl: (initialData?.type === "section" || initialData?.type === "header") ? initialData.content?.image ?? "" : "",
            text_alignment: initialData?.type === "section" ? initialData.content?.text_alignment ?? "center" : "center",
            layout: initialData?.type === "section" ? initialData.content?.layout ?? "text-top-image-bottom" : "text-top-image-bottom",
            slides_per_view_tablet: initialData?.type === "carousel" ? initialData.content?.slides_per_view_tablet ?? 1 : 1,
            slides_per_view_desktop: initialData?.type === "carousel" ? initialData.content?.slides_per_view_desktop ?? 1 : 1,
            items: (initialData?.type === "carousel" || initialData?.type === "features") && Array.isArray(initialData.content?.items)
                ? initialData.content.items.map((item: any) => ({
                    title: item.title ?? "",
                    slug: item.slug ?? "",
                    description: item.description ?? "",
                    caption: item.caption ?? "",
                    imageUrl: item.image ?? "",
                    imageFile: undefined,
                }))
                : [{ title: "", slug: "", description: "", caption: "", imageUrl: "", imageFile: undefined }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const selectedType = watch("type");

    // Auto-update contentRaw default structure when section type changes and it's a new section
    React.useEffect(() => {
        if (!initialData && selectedType !== "section" && selectedType !== "carousel" && selectedType !== "features") {
            setValue("contentRaw", JSON.stringify(getDefaultContentForType(selectedType), null, 2));
        }
    }, [selectedType, setValue, initialData]);

    const handleSave = (data: SectionFormValues) => {
        startTransition(async () => {
            let finalImageUrl = data.imageUrl || "";

            // 1. Handle File Upload if present
            if ((data.type === "section" || data.type === "header") && data.imageFile instanceof File) {
                const uploadFormData = new FormData();
                uploadFormData.append("image", data.imageFile);

                const uploadRes = await uploadSectionMedia(uploadFormData);
                if (!uploadRes.success) {
                    toast.error(uploadRes.error || "Failed to upload image");
                    return;
                }
                if (!uploadRes.data?.url) {
                    toast.error("Failed to upload image");
                    return;
                }
                finalImageUrl = uploadRes.data.url;
            } else if ((data.type === "section" || data.type === "header") && data.imageFile === null) {
                // If it was cleared
                finalImageUrl = "";
            }

            // 2. Construct final payload
            let parsedContent: any;
            const isFixedType = isFixedSectionType(data.type);
            if (isFixedType) {
                parsedContent = [];
            } else if (data.type === "section" || data.type === "header") {
                parsedContent = {
                    title: data.title || "",
                    description: data.description || "",
                    image: finalImageUrl,
                    ...(data.type === "section" ? {
                        text_alignment: data.text_alignment || "center",
                        layout: data.layout || "text-top-image-bottom",
                    } : {}),
                };
            } else if (data.type === "carousel" || data.type === "features") {
                const updatedItems = [];
                if (data.items) {
                    for (const item of data.items) {
                        let itemImageUrl = item.imageUrl || "";
                        if (item.imageFile instanceof File) {
                            const uploadFormData = new FormData();
                            uploadFormData.append("image", item.imageFile);

                            const uploadRes = await uploadSectionMedia(uploadFormData);
                            if (!uploadRes.success) {
                                toast.error(uploadRes.error || "Failed to upload image");
                                return;
                            }
                            itemImageUrl = uploadRes.data?.url || "";
                        } else if (item.imageFile === null) {
                            itemImageUrl = "";
                        }
                        
                        if (data.type === "carousel") {
                            updatedItems.push({
                                caption: item.caption || "",
                                image: itemImageUrl,
                            });
                        } else {
                            updatedItems.push({
                                title: item.title || "",
                                slug: slugify(item.slug || item.title || ""),
                                description: item.description || "",
                                image: itemImageUrl,
                            });
                        }
                    }
                }
                parsedContent = {
                    title: data.title || "",
                    description: data.description || "",
                    ...(data.type === "carousel" ? {
                        slides_per_view_tablet: data.slides_per_view_tablet || 1,
                        slides_per_view_desktop: data.slides_per_view_desktop || 1,
                    } : {}),
                    items: updatedItems,
                };
            } else {
                parsedContent = JSON.parse(data.contentRaw || "{}");
            }

            const payload = {
                order: data.order,
                type: data.type,
                content: parsedContent,
            };

            const result = initialData?.id
                ? await updateSection(initialData.id, payload)
                : await createSection(payload);

            if (!result.success) {
                toast.error(result.error);
                return;
            }

            toast.success(t("messages.success", { defaultValue: "Saved successfully!" }));
            onSuccess();
        });
    };

    return (
        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
            <FieldSet>
                <FieldGroup>
                    {/* Order Field */}
                    <Field>
                        <Label>{t("attributes.order", { defaultValue: "Order / Position" })}</Label>
                        <NumericInput
                            allowDecimal={false}
                            {...register("order")}
                            placeholder="0"
                            className="mt-2"
                        />
                        {errors.order && (
                            <FieldError>{t(errors.order.message as string, { defaultValue: "Invalid order value" })}</FieldError>
                        )}
                    </Field>

                    {/* Section Type Select */}
                    <Field>
                        <Label>{t("attributes.section_type", { defaultValue: "Section Type" })}</Label>
                        <select
                            {...register("type")}
                            className="mt-2 w-full px-3 py-2 border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {SECTION_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {t("sections." + type.value, { defaultValue: type.label })}
                                </option>
                            ))}
                        </select>
                        {errors.type && (
                            <FieldError>{t(errors.type.message as string, { defaultValue: "Required" })}</FieldError>
                        )}
                    </Field>

                    {/* Content Form or Raw JSON */}
                    {selectedType === "section" || selectedType === "header" ? (
                        <>
                            {/* Title Field */}
                            <Field>
                                <Label>{t("attributes.title", { defaultValue: "Title" })}</Label>
                                <Input
                                    type="text"
                                    {...register("title")}
                                    placeholder={t("attributes.title", { defaultValue: "Title" })}
                                    className="mt-2"
                                />
                            </Field>

                            {/* Description Field */}
                            <Field>
                                <Label>{t("attributes.description", { defaultValue: "Description" })}</Label>
                                <Textarea
                                    rows={4}
                                    {...register("description")}
                                    placeholder={t("attributes.description", { defaultValue: "Description" })}
                                    className="mt-2"
                                />
                            </Field>

                            {/* Image Upload Field */}
                            <Field>
                                <Label>{t("attributes.image", { defaultValue: "Image" })}</Label>
                                <FileUpload
                                    name="imageFile"
                                    control={control}
                                    initialUrl={(initialData?.type === "section" || initialData?.type === "header") ? initialData.content?.image : null}
                                    className="mt-2"
                                />
                            </Field>

                            {selectedType === "section" && (
                                <>
                                    {/* Text Alignment */}
                                    <Field>
                                        <Label>{t("attributes.text_alignment", { defaultValue: "Text Alignment" })}</Label>
                                        <select
                                            {...register("text_alignment")}
                                            className="mt-2 w-full px-3 py-2 border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="left">{t("alignment.left", { defaultValue: "Left" })}</option>
                                            <option value="center">{t("alignment.center", { defaultValue: "Center" })}</option>
                                            <option value="right">{t("alignment.right", { defaultValue: "Right" })}</option>
                                        </select>
                                    </Field>

                                    {/* Layout Positioning */}
                                    <Field>
                                        <Label>{t("attributes.layout", { defaultValue: "Layout / Element Order" })}</Label>
                                        <select
                                            {...register("layout")}
                                            className="mt-2 w-full px-3 py-2 border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="text-left-image-right">{t("layouts.text_left_image_right", { defaultValue: "Text Left, Image Right" })}</option>
                                            <option value="text-right-image-left">{t("layouts.text_right_image_left", { defaultValue: "Text Right, Image Left" })}</option>
                                            <option value="text-top-image-bottom">{t("layouts.text_top_image_bottom", { defaultValue: "Text Center, Image Below" })}</option>
                                            <option value="text-bottom-image-top">{t("layouts.text_bottom_image_top", { defaultValue: "Text Center, Image Above" })}</option>
                                        </select>
                                    </Field>
                                </>
                            )}
                        </>
                    ) : ["navbar", "products", "vision", "goals", "branches_map", "footer", "plans"].includes(selectedType) ? (
                        <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center border border-dashed">
                            {t("messages.fixed_section_no_config", { defaultValue: "This is a fixed layout section. No configuration is required." })}
                        </div>
                    ) : selectedType === "carousel" ? (
                        <>
                            {/* Carousel Title */}
                            <Field>
                                <Label>{t("attributes.title", { defaultValue: "Title" })}</Label>
                                <Input
                                    type="text"
                                    {...register("title")}
                                    placeholder={t("attributes.title", { defaultValue: "Title" })}
                                    className="mt-2"
                                />
                            </Field>

                            {/* Carousel Description */}
                            <Field>
                                <Label>{t("attributes.description", { defaultValue: "Description" })}</Label>
                                <Textarea
                                    rows={3}
                                    {...register("description")}
                                    placeholder={t("attributes.description", { defaultValue: "Description" })}
                                    className="mt-2"
                                />
                            </Field>

                            {/* Slides per view (Tablet) */}
                            <Field>
                                <Label>{t("attributes.slides_per_view_tablet", { defaultValue: "Slides per screen (Tablet)" })}</Label>
                                <select
                                    {...register("slides_per_view_tablet")}
                                    className="mt-2 w-full px-3 py-2 border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                </select>
                            </Field>

                            {/* Slides per view (Large Screens) */}
                            <Field>
                                <Label>{t("attributes.slides_per_view_desktop", { defaultValue: "Slides per screen (Large Screens)" })}</Label>
                                <select
                                    {...register("slides_per_view_desktop")}
                                    className="mt-2 w-full px-3 py-2 border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                </select>
                            </Field>

                            {/* Slider Items list */}
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-sm">{t("sections.slides", { defaultValue: "Slides" })}</h4>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ caption: "", imageUrl: "", imageFile: undefined })}
                                    >
                                        + {t("buttons.add_slide", { defaultValue: "Add Slide" })}
                                    </Button>
                                </div>

                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 border rounded-lg bg-muted/20 relative space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-muted-foreground">{t("sections.slide_number", { number: index + 1, defaultValue: `Slide ${index + 1}` })}</span>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive h-7 px-2 hover:bg-destructive/10"
                                                    onClick={() => remove(index)}
                                                >
                                                    {t("buttons.delete", { defaultValue: "Delete" })}
                                                </Button>
                                            )}
                                        </div>

                                        {/* Slide Image File Upload */}
                                        <Field>
                                            <Label>{t("attributes.image", { defaultValue: "Image" })}</Label>
                                            <FileUpload
                                                name={`items.${index}.imageFile` as any}
                                                control={control}
                                                initialUrl={field.imageUrl}
                                                className="mt-2"
                                            />
                                        </Field>

                                        {/* Slide Caption */}
                                        <Field>
                                            <Label>{t("attributes.caption", { defaultValue: "Caption" })}</Label>
                                            <Input
                                                type="text"
                                                {...register(`items.${index}.caption` as any)}
                                                placeholder={t("attributes.caption", { defaultValue: "Caption" })}
                                                className="mt-2"
                                            />
                                        </Field>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : selectedType === "features" ? (
                        <>
                            {/* Features Title */}
                            <Field>
                                <Label>{t("attributes.title", { defaultValue: "Title" })}</Label>
                                <Input
                                    type="text"
                                    {...register("title")}
                                    placeholder={t("attributes.title", { defaultValue: "Title" })}
                                    className="mt-2"
                                />
                            </Field>

                            {/* Features Description */}
                            <Field>
                                <Label>{t("attributes.description", { defaultValue: "Description" })}</Label>
                                <Textarea
                                    rows={3}
                                    {...register("description")}
                                    placeholder={t("attributes.description", { defaultValue: "Description" })}
                                    className="mt-2"
                                />
                            </Field>

                            {/* Feature Items list */}
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-sm">{t("sections.feature_items", { defaultValue: "Feature Cards" })}</h4>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ title: "", slug: "", description: "", imageUrl: "", imageFile: undefined })}
                                    >
                                        + {t("buttons.add_feature", { defaultValue: "Add Feature" })}
                                    </Button>
                                </div>

                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 border rounded-lg bg-muted/20 relative space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-muted-foreground">{t("sections.feature_number", { number: index + 1, defaultValue: `Feature ${index + 1}` })}</span>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive h-7 px-2 hover:bg-destructive/10"
                                                    onClick={() => remove(index)}
                                                >
                                                    {t("buttons.delete", { defaultValue: "Delete" })}
                                                </Button>
                                            )}
                                        </div>

                                        {/* Feature Card Title */}
                                        <Field>
                                            <Label>{t("attributes.title", { defaultValue: "Title" })}</Label>
                                            <Input
                                                type="text"
                                                {...register(`items.${index}.title` as any, {
                                                    onBlur: (e) => {
                                                        // Auto fill the slug from the title while the user hasn't set one
                                                        if (!getValues(`items.${index}.slug` as any)) {
                                                            setValue(`items.${index}.slug` as any, slugify(e.target.value));
                                                        }
                                                    },
                                                })}
                                                placeholder={t("attributes.title", { defaultValue: "Title" })}
                                                className="mt-2"
                                            />
                                        </Field>

                                        {/* Feature Card Slug (used for its standalone landing page) */}
                                        <Field>
                                            <Label>{t("attributes.slug", { defaultValue: "Slug" })}</Label>
                                            <Input
                                                dir="ltr"
                                                type="text"
                                                {...register(`items.${index}.slug` as any)}
                                                onBlur={(e) => setValue(`items.${index}.slug` as any, slugify(e.target.value))}
                                                placeholder={t("sections.feature_slug_placeholder", { defaultValue: "e.g. smart-attendance" })}
                                                className="mt-2 font-mono text-xs"
                                            />
                                            {(errors.items as any)?.[index]?.slug && (
                                                <FieldError>
                                                    {t((errors.items as any)[index].slug.message as string, { defaultValue: "Invalid slug" })}
                                                </FieldError>
                                            )}
                                        </Field>

                                        {/* Feature Card Description */}
                                        <Field>
                                            <Label>{t("attributes.description", { defaultValue: "Description" })}</Label>
                                            <Textarea
                                                rows={2}
                                                {...register(`items.${index}.description` as any)}
                                                placeholder={t("attributes.description", { defaultValue: "Description" })}
                                                className="mt-2"
                                            />
                                        </Field>

                                        {/* Feature Card Image */}
                                        <Field>
                                            <Label>{t("attributes.image", { defaultValue: "Image" })}</Label>
                                            <FileUpload
                                                name={`items.${index}.imageFile` as any}
                                                control={control}
                                                initialUrl={field.imageUrl}
                                                className="mt-2"
                                            />
                                        </Field>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        /* Content raw JSON Field */
                        <Field>
                            <Label>{t("attributes.content", { defaultValue: "Section Content (JSON)" })}</Label>
                            <Textarea
                                dir="ltr"
                                rows={8}
                                {...register("contentRaw")}
                                placeholder='{ "title": "Example" }'
                                className="mt-2 font-mono text-xs bg-muted/20"
                            />
                            {errors.contentRaw && (
                                <FieldError>
                                    {t(errors.contentRaw.message as string, { defaultValue: "Invalid JSON format" })}
                                </FieldError>
                            )}
                        </Field>
                    )}
                </FieldGroup>
            </FieldSet>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="submit" disabled={isPending} className="gap-2">
                    {isPending ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {t("buttons.save", { defaultValue: "Save Changes" })}
                </Button>
            </div>
        </form>
    );
}

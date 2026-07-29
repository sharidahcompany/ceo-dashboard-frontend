"use client";

import {
    BuffetItemResource,
    createBuffetItem,
    updateBuffetItem,
} from "@/actions/buffet/buffet-item.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldSeparator, FieldSet } from "@/components/ui/field";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Coffee } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export const buffetItemSchema = z.object({
    buffet_category_id: z.union([z.string(), z.number()]).refine((val) => !!val, {
        message: "validation.required",
    }),
    name: z.object({
        ar: z.string().min(1, { message: "validation.required" }),
        en: z.string().min(1, { message: "validation.required" }),
    }),
    description: z.object({
        ar: z.string().min(1, { message: "validation.required" }),
        en: z.string().min(1, { message: "validation.required" }),
    }),
    price: z.number().min(0, { message: "validation.min_value" }),
    is_available: z.boolean().optional(),
    is_vip: z.boolean().optional(),
    is_active: z.boolean().optional(),
    icon: z.any().optional(),
});

export type BuffetItemFormData = z.infer<typeof buffetItemSchema>;

export default function BuffetItemForm({
    initialData,
    categoryId,
    onSuccess,
}: {
    initialData?: BuffetItemResource;
    categoryId?: number | string;
    onSuccess: () => void;
}) {
    const t = useTranslations();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<BuffetItemFormData>({
        resolver: zodResolver(buffetItemSchema),
        defaultValues: {
            buffet_category_id: categoryId || initialData?.buffet_category_id || "",
            name: {
                ar: initialData?.name?.ar || "",
                en: initialData?.name?.en || "",
            },
            description: {
                ar: initialData?.description?.ar || "",
                en: initialData?.description?.en || "",
            },
            price: initialData?.price !== undefined ? Number(initialData.price) : 0,
            is_available: initialData?.is_available ?? true,
            is_vip: initialData?.is_vip ?? false,
            is_active: initialData?.is_active ?? true,
            icon: null,
        },
    });

    const [isPending, startTransition] = React.useTransition();

    const handleSave = (data: BuffetItemFormData) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("buffet_category_id", String(categoryId || data.buffet_category_id));
            formData.append("name[ar]", data.name.ar);
            formData.append("name[en]", data.name.en);
            formData.append("description[ar]", data.description.ar);
            formData.append("description[en]", data.description.en);
            formData.append("price", String(data.price));
            formData.append("is_available", data.is_available ? "1" : "0");
            formData.append("is_vip", data.is_vip ? "1" : "0");
            formData.append("is_active", data.is_active ? "1" : "0");

            if (data.icon instanceof File) {
                formData.append("icon", data.icon);
            }

            if (initialData?.id) {
                const result = await updateBuffetItem(initialData.id, formData);
                if (!result.success) {
                    toast.error(result.error);
                    return;
                }
                toast.success(result.data.message);
                onSuccess();
            } else {
                const result = await createBuffetItem(formData);
                if (!result.success) {
                    toast.error(result.error);
                    return;
                }
                toast.success(result.data.message);
                onSuccess();
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(handleSave)}>
            <FieldSet>
                <FieldGroup>
                    <Field>
                        <Label>{t("attributes.name_ar")}</Label>
                        <Input
                            {...register("name.ar")}
                            placeholder={t("attributes.name_ar")}
                        />
                        {errors?.name?.ar && (
                            <FieldError>{t(errors.name.ar.message!)}</FieldError>
                        )}
                    </Field>

                    <Field>
                        <Label>{t("attributes.name_en")}</Label>
                        <Input
                            {...register("name.en")}
                            placeholder={t("attributes.name_en")}
                        />
                        {errors?.name?.en && (
                            <FieldError>{t(errors.name.en.message!)}</FieldError>
                        )}
                    </Field>

                    <Field>
                        <Label>{t("attributes.description_ar")}</Label>
                        <Textarea
                            {...register("description.ar")}
                            placeholder={t("attributes.description_ar")}
                        />
                        {errors?.description?.ar && (
                            <FieldError>{t(errors.description.ar.message!)}</FieldError>
                        )}
                    </Field>

                    <Field>
                        <Label>{t("attributes.description_en")}</Label>
                        <Textarea
                            {...register("description.en")}
                            placeholder={t("attributes.description_en")}
                        />
                        {errors?.description?.en && (
                            <FieldError>{t(errors.description.en.message!)}</FieldError>
                        )}
                    </Field>

                    <Field>
                        <Label>{t("attributes.price")}</Label>
                        <Input
                            type="number"
                            step="0.01"
                            {...register("price", { valueAsNumber: true })}
                            placeholder={t("attributes.price")}
                        />
                        {errors?.price && (
                            <FieldError>{t(errors.price.message!)}</FieldError>
                        )}
                    </Field>

                    <Field>
                        <Label>{t("attributes.image")}</Label>
                        <FileUpload
                            name="icon"
                            control={control}
                            initialUrl={initialData?.icon}
                        />
                    </Field>

                    <div className="flex flex-wrap gap-6 pt-2">
                        <Controller
                            name="is_available"
                            control={control}
                            render={({ field }) => (
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                    <Checkbox
                                        checked={!!field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    <span>{t("attributes.is_available")}</span>
                                </label>
                            )}
                        />

                        <Controller
                            name="is_vip"
                            control={control}
                            render={({ field }) => (
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                    <Checkbox
                                        checked={!!field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    <span>{t("attributes.is_vip")}</span>
                                </label>
                            )}
                        />

                        <Controller
                            name="is_active"
                            control={control}
                            render={({ field }) => (
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                    <Checkbox
                                        checked={!!field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    <span>{t("attributes.is_active")}</span>
                                </label>
                            )}
                        />
                    </div>
                </FieldGroup>

                <FieldSeparator />

                <FieldGroup>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <Spinner /> : <Coffee className="w-4 h-4" />}
                        {initialData
                            ? t("messages.buffets.update_item")
                            : t("messages.buffets.add_new_item")}
                    </Button>
                </FieldGroup>
            </FieldSet>
        </form>
    );
}

"use client";

import {
    BuffetCategoryResource,
    createBuffetCategory,
    updateBuffetCategory,
} from "@/actions/buffet/buffet-category.actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldSeparator, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectBuffet } from "@/components/ui/select-buffet";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export const buffetCategorySchema = z.object({
    name: z.object({
        ar: z.string().min(1, { message: "validation.required" }),
        en: z.string().min(1, { message: "validation.required" }),
    }),
    buffet_id: z.union([z.string(), z.number()]).optional(),
});

export type BuffetCategoryFormData = z.infer<typeof buffetCategorySchema>;

export default function BuffetCategoryForm({
    initialData,
    buffetId,
    onSuccess,
}: {
    initialData?: BuffetCategoryResource;
    buffetId?: number | string;
    onSuccess: () => void;
}) {
    const t = useTranslations();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<BuffetCategoryFormData>({
        resolver: zodResolver(buffetCategorySchema),
        defaultValues: {
            name: {
                ar: initialData?.name?.ar || "",
                en: initialData?.name?.en || "",
            },
            buffet_id: buffetId || initialData?.buffet_id || "",
        },
    });

    const [isPending, startTransition] = React.useTransition();

    const handleSave = (data: BuffetCategoryFormData) => {
        startTransition(async () => {
            const payload = {
                ...data,
                buffet_id: buffetId || data.buffet_id,
            };

            if (initialData?.id) {
                const result = await updateBuffetCategory(initialData.id, payload);
                if (!result.success) {
                    toast.error(result.error);
                    return;
                }
                toast.success(result.data.message);
                onSuccess();
            } else {
                const result = await createBuffetCategory(payload);
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

                    {!buffetId && (
                        <Field>
                            <Label>{t("messages.buffets.select_buffet")}</Label>
                            <SelectBuffet
                                control={control}
                                name="buffet_id"
                                initialBuffet={initialData?.buffet}
                            />
                            {errors?.buffet_id && (
                                <FieldError>{t(errors.buffet_id.message!)}</FieldError>
                            )}
                        </Field>
                    )}
                </FieldGroup>

                <FieldSeparator />

                <FieldGroup>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <Spinner /> : <Layers className="w-4 h-4" />}
                        {initialData
                            ? t("messages.buffets.update_category")
                            : t("messages.buffets.add_new_category")}
                    </Button>
                </FieldGroup>
            </FieldSet>
        </form>
    );
}

"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, NumericInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldSet,
} from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    getTaxRate,
    createTaxRate,
    updateTaxRate,
    TaxRateFormData,
    TaxType,
} from "@/actions/finance/tax-rate.actions";

const taxRateSchema = z.object({
    name: z.object({
        ar: z.string().min(1, { message: "validation.required" }),
        en: z.string().min(1, { message: "validation.required" }),
    }),
    tax_type: z.enum(["OUT_OF_SCOPE", "REVERSE_CHARGE", "PURCHASES", "SALES"]),
    tax_rate: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null && v !== undefined, {
        message: "validation.required",
    }),
    description: z
        .object({
            ar: z.string().optional(),
            en: z.string().optional(),
        })
        .optional(),
});

type TaxRateFormValues = z.infer<typeof taxRateSchema>;

const taxTypes: TaxType[] = ["OUT_OF_SCOPE", "REVERSE_CHARGE", "PURCHASES", "SALES"];

export default function TaxRateForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const taxRateId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!taxRateId);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<TaxRateFormValues>({
        resolver: zodResolver(taxRateSchema),
        defaultValues: {
            name: { ar: "", en: "" },
            tax_type: "SALES",
            tax_rate: 0,
            description: { ar: "", en: "" },
        },
    });

    useEffect(() => {
        if (!taxRateId) return;
        const loadTaxRate = async () => {
            const res = await getTaxRate(taxRateId);
            if (res.success) {
                const tr = res.data;
                setValue("name", { ar: tr.name?.ar || "", en: tr.name?.en || "" });
                setValue("tax_type", tr.tax_type?.value || "SALES");
                setValue("tax_rate", tr.tax_rate);
                const desc = tr.description;
                if (desc && typeof desc === "object") {
                    setValue("description", { ar: desc.ar || "", en: desc.en || "" });
                }
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadTaxRate();
    }, [taxRateId, setValue]);

    const onSubmit = (values: TaxRateFormValues) => {
        startTransition(async () => {
            const payload: TaxRateFormData = { ...values };

            const res = taxRateId
                ? await updateTaxRate(taxRateId, payload)
                : await createTaxRate(payload);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.back();
            } else {
                toast.error(res.error);
            }
        });
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="w-full">
                    <CardHeader className="border-b">
                        <CardTitle>
                            {taxRateId ? t("attributes.edit_tax_rate") || "Edit Tax Rate" : t("attributes.create_tax_rate") || "Create Tax Rate"}
                        </CardTitle>
                        <CardDescription>{t("routes.finance") || "Finance"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                <Field>
                                    <FieldLabel>{t("attributes.name_en")}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("name.en")} placeholder={t("attributes.name_en")} />
                                        {errors.name?.en && <FieldError>{t(errors.name.en.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.name_ar")}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("name.ar")} placeholder={t("attributes.name_ar")} className="text-right" dir="rtl" />
                                        {errors.name?.ar && <FieldError>{t(errors.name.ar.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.tax_type") || "Tax Type"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="tax_type"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue>{(value: string) => t(`enums.taxType.${value}`)}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {taxTypes.map((tt) => (
                                                            <SelectItem key={tt} value={tt}>{t(`enums.taxType.${tt}`)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.tax_type && <FieldError>{t(errors.tax_type.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.tax_rate") || "Tax Rate"}</FieldLabel>
                                    <FieldContent>
                                        <NumericInput {...register("tax_rate")} placeholder={t("attributes.tax_rate") || "Tax Rate"} />
                                        {errors.tax_rate && <FieldError>{t(errors.tax_rate.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.description_en")}</FieldLabel>
                                    <FieldContent>
                                        <Textarea {...register("description.en")} placeholder={t("attributes.description_en")} rows={3} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.description_ar")}</FieldLabel>
                                    <FieldContent>
                                        <Textarea {...register("description.ar")} placeholder={t("attributes.description_ar")} rows={3} />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" disabled={isPending} className="gap-2" onClick={() => router.back()}>
                        <X className="size-4" />
                        {t("buttons.cancel")}
                    </Button>
                    <Button type="submit" disabled={isPending} className="gap-2">
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        {t("buttons.save")}
                    </Button>
                </div>
            </form>
        </div>
    );
}

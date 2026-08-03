"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, X, Save } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    getAvailableScholarship,
    createAvailableScholarship,
    updateAvailableScholarship,
    AvailableScholarshipData
} from "@/actions/workspace/scholarships.actions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldSet
} from "@/components/ui/field";

interface AvailableScholarshipFormValues {
    title: string;
    description: string;
    price: string;
    discount_percentage: string;
    duration: string;
    is_active: boolean;
}

export default function AvailableScholarshipForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const scholarshipId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!scholarshipId);

    const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<AvailableScholarshipFormValues>({
        defaultValues: {
            title: "",
            description: "",
            price: "",
            discount_percentage: "",
            duration: "",
            is_active: true,
        }
    });

    useEffect(() => {
        const loadInitialData = async () => {
            if (scholarshipId) {
                const res = await getAvailableScholarship(scholarshipId);
                if (res.success) {
                    const data = res.data;
                    setValue("title", data.title || "");
                    setValue("description", data.description || "");
                    setValue("price", data.price !== undefined ? String(data.price) : "");
                    setValue("discount_percentage", data.discount_percentage !== undefined ? String(data.discount_percentage) : "");
                    setValue("duration", data.duration || "");
                    setValue("is_active", data.is_active ?? true);
                } else {
                    toast.error(res.error);
                }
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [scholarshipId, setValue]);

    const onSubmit = (values: AvailableScholarshipFormValues) => {
        startTransition(async () => {
            const payload: AvailableScholarshipData = {
                title: values.title,
                description: values.description,
                price: Number(values.price),
                discount_percentage: Number(values.discount_percentage),
                duration: values.duration,
                is_active: values.is_active,
            };

            const res = scholarshipId
                ? await updateAvailableScholarship(scholarshipId, payload)
                : await createAvailableScholarship(payload);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/scholarships/available-scholarships");
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
                            {scholarshipId ? t("routes.edit_scholarship") || "Edit Scholarship" : t("routes.create_scholarship") || "Create Scholarship"}
                        </CardTitle>
                        <CardDescription>
                            {t("routes.available_scholarships") || "Manage available training and academic scholarship programs"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                {/* Title */}
                                <Field className="md:col-span-2">
                                    <FieldLabel>{t("attributes.title") || "Title"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("title", { required: "validation.required" })}
                                            placeholder={t("attributes.title") || "Scholarship Title"}
                                        />
                                        {errors.title && (
                                            <FieldError>{t(errors.title.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Description */}
                                <Field className="md:col-span-2">
                                    <FieldLabel>{t("attributes.description") || "Description"}</FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            {...register("description", { required: "validation.required" })}
                                            placeholder={t("attributes.description") || "Scholarship Description"}
                                            rows={4}
                                        />
                                        {errors.description && (
                                            <FieldError>{t(errors.description.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Price */}
                                <Field>
                                    <FieldLabel>{t("attributes.price") || "Price"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...register("price", { required: "validation.required" })}
                                            placeholder="0.00"
                                        />
                                        {errors.price && (
                                            <FieldError>{t(errors.price.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Discount Percentage */}
                                <Field>
                                    <FieldLabel>{t("attributes.discount_percentage") || "Discount Percentage"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            {...register("discount_percentage", { required: "validation.required" })}
                                            placeholder="0.00"
                                        />
                                        {errors.discount_percentage && (
                                            <FieldError>{t(errors.discount_percentage.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Duration */}
                                <Field>
                                    <FieldLabel>{t("attributes.duration") || "Duration"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("duration", { required: "validation.required" })}
                                            placeholder={t("attributes.duration") || "e.g., 1 Year, 6 Months"}
                                        />
                                        {errors.duration && (
                                            <FieldError>{t(errors.duration.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Status (is_active) */}
                                <Field>
                                    <FieldLabel>{t("attributes.status") || "Status"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="is_active"
                                            control={control}
                                            render={({ field }) => {
                                                const selectedLabel = field.value
                                                    ? (t("attributes.active") || "Active")
                                                    : (t("attributes.inactive") || "Inactive");
                                                return (
                                                    <Select
                                                        value={field.value ? "active" : "inactive"}
                                                        onValueChange={(val) => field.onChange(val === "active")}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue>{selectedLabel}</SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">{t("attributes.active") || "Active"}</SelectItem>
                                                            <SelectItem value="inactive">{t("attributes.inactive") || "Inactive"}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                );
                                            }}
                                        />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/scholarships/available-scholarships">
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
        </div>
    );
}

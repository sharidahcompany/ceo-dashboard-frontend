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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldSet,
} from "@/components/ui/field";
import { SelectUser } from "@/components/ui/select-user";

import {
    getCustomer,
    createCustomer,
    updateCustomer,
    CustomerFormData,
} from "@/actions/finance/customer.actions";

const customerSchema = z.object({
    user_id: z.union([z.string(), z.number()]).optional().nullable(),
    name: z.object({
        ar: z.string().min(1, { message: "validation.required" }),
        en: z.string().min(1, { message: "validation.required" }),
    }),
    phone: z.string().optional(),
    email: z.string().optional(),
    is_vat_registered: z.boolean().optional(),
    tax_number: z.string().optional(),
    building_number: z.string().optional(),
    street: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomerForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const customerId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!customerId);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            user_id: null,
            name: { ar: "", en: "" },
            phone: "",
            email: "",
            is_vat_registered: false,
            tax_number: "",
            building_number: "",
            street: "",
            district: "",
            city: "",
            postal_code: "",
            country: "",
        },
    });

    useEffect(() => {
        if (!customerId) return;
        const loadCustomer = async () => {
            const res = await getCustomer(customerId);
            if (res.success) {
                const c = res.data;
                setValue("user_id", c.user_id ? String(c.user_id) : null);
                setValue("name", { ar: c.name?.ar || "", en: c.name?.en || "" });
                setValue("phone", c.phone || "");
                setValue("email", c.email || "");
                setValue("is_vat_registered", !!c.is_vat_registered);
                setValue("tax_number", c.tax_number || "");
                setValue("building_number", c.building_number || "");
                setValue("street", c.street || "");
                setValue("district", c.district || "");
                setValue("city", c.city || "");
                setValue("postal_code", c.postal_code || "");
                setValue("country", c.country || "");
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadCustomer();
    }, [customerId, setValue]);

    const onSubmit = (values: CustomerFormValues) => {
        startTransition(async () => {
            const payload: CustomerFormData = {
                ...values,
                user_id: values.user_id || undefined,
            };

            const res = customerId
                ? await updateCustomer(customerId, payload)
                : await createCustomer(payload);

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
                            {customerId ? t("attributes.edit_customer") || "Edit Customer" : t("attributes.create_customer") || "Create Customer"}
                        </CardTitle>
                        <CardDescription>{t("routes.finance") || "Finance"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                <Field>
                                    <FieldLabel>{t("attributes.name_en") || "Name (English)"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("name.en")} placeholder={t("attributes.name_en") || "Name (English)"} />
                                        {errors.name?.en && <FieldError>{t(errors.name.en.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.name_ar") || "Name (Arabic)"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("name.ar")} placeholder={t("attributes.name_ar") || "Name (Arabic)"} dir="rtl" className="text-right" />
                                        {errors.name?.ar && <FieldError>{t(errors.name.ar.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.user") || "Linked User"}</FieldLabel>
                                    <FieldContent>
                                        <SelectUser control={control} name="user_id" isTenantOnly />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.phone") || "Phone"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("phone")} placeholder={t("attributes.phone") || "Phone"} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.email") || "Email"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="email" {...register("email")} placeholder={t("attributes.email") || "Email"} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.tax_number") || "Tax Number"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("tax_number")} placeholder={t("attributes.tax_number") || "Tax Number"} />
                                    </FieldContent>
                                </Field>

                                <Field orientation="horizontal">
                                    <Controller
                                        name="is_vat_registered"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                checked={!!field.value}
                                                onCheckedChange={(checked) => field.onChange(!!checked)}
                                                className="border-input data-checked:bg-primary"
                                            />
                                        )}
                                    />
                                    <FieldLabel className="font-normal">
                                        {t("attributes.is_vat_registered") || "VAT Registered"}
                                    </FieldLabel>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.building_number") || "Building Number"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("building_number")} placeholder={t("attributes.building_number") || "Building Number"} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.street") || "Street"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("street")} placeholder={t("attributes.street") || "Street"} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.district") || "District"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("district")} placeholder={t("attributes.district") || "District"} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.city") || "City"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("city")} placeholder={t("attributes.city") || "City"} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.postal_code") || "Postal Code"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("postal_code")} placeholder={t("attributes.postal_code") || "Postal Code"} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.country") || "Country"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("country")} placeholder={t("attributes.country") || "Country"} />
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

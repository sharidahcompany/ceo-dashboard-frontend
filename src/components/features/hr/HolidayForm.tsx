"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, X, Save } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    getHoliday,
    createHoliday,
    updateHoliday,
    HolidayResource,
    HolidayData
} from "@/actions/workspace/holiday.actions";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldSet
} from "@/components/ui/field";

interface HolidayFormValues {
    name: string;
    date: string;
}

export default function HolidayForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const holidayId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!holidayId);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<HolidayFormValues>({
        defaultValues: {
            name: "",
            date: "",
        }
    });

    useEffect(() => {
        const loadInitialData = async () => {
            if (holidayId) {
                const res = await getHoliday(holidayId);
                if (res.success) {
                    const data = res.data;
                    setValue("name", data.name || "");
                    setValue("date", data.date || "");
                } else {
                    toast.error(res.error);
                }
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [holidayId, setValue]);

    const onSubmit = (values: HolidayFormValues) => {
        startTransition(async () => {
            const payload: HolidayData = {
                name: values.name,
                date: values.date,
            };

            const res = holidayId
                ? await updateHoliday(holidayId, payload)
                : await createHoliday(payload);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/holidays");
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
                            {holidayId ? t("routes.edit_holiday") || "Edit Holiday" : t("routes.create_holiday") || "Create Holiday"}
                        </CardTitle>
                        <CardDescription>
                            {t("routes.holidays") || "Manage organization holidays and official vacations"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                {/* Name */}
                                <Field>
                                    <FieldLabel>{t("attributes.name") || "Holiday Name"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("name", { required: "validation.required" })}
                                            placeholder={t("attributes.name") || "Holiday Name"}
                                        />
                                        {errors.name && (
                                            <FieldError>{t(errors.name.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Date */}
                                <Field>
                                    <FieldLabel>{t("attributes.date") || "Date"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="date"
                                            {...register("date", { required: "validation.required" })}
                                        />
                                        {errors.date && (
                                            <FieldError>{t(errors.date.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/holidays">
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

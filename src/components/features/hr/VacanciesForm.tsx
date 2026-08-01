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
import { Loader2, Plus, X, Save } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    getVacancy,
    createVacancy,
    updateVacancy
} from "@/actions/workspace/vacancies.actions";
import { getPositions, PositionResource } from "@/actions/workspace/positions.actions";
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

interface VacanciesFormValues {
    position_id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
}

export default function VacanciesForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const vacancyId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!vacancyId);
    const [positionsList, setPositionsList] = useState<PositionResource[]>([]);

    const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<VacanciesFormValues>({
        defaultValues: {
            position_id: "",
            title: "",
            description: "",
            start_date: "",
            end_date: "",
        }
    });

    const selectedPositionId = watch("position_id");

    useEffect(() => {
        const loadInitialData = async () => {
            // Load available positions
            const posRes = await getPositions();
            if (posRes.success && posRes.data) {
                setPositionsList(posRes.data.data);
            }

            if (vacancyId) {
                const vacRes = await getVacancy(vacancyId);
                if (vacRes.success) {
                    const vac = vacRes.data;
                    setValue("position_id", vac.position?.id ? String(vac.position.id) : "");
                    setValue("title", vac.title || "");
                    setValue("description", vac.description || "");
                    setValue("start_date", vac.start_date || "");
                    setValue("end_date", vac.end_date || "");
                } else {
                    toast.error(vacRes.error);
                }
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [vacancyId, setValue]);

    const onSubmit = (values: VacanciesFormValues) => {
        startTransition(async () => {
            const res = vacancyId 
                ? await updateVacancy(vacancyId, values)
                : await createVacancy(values);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/vacancies");
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

    const currentSelectedPosition = positionsList.find(p => String(p.id) === selectedPositionId);

    return (
        <div className="space-y-6 w-full">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="w-full">
                    <CardHeader className="border-b">
                        <CardTitle>
                            {vacancyId ? t("routes.edit_vacancy") : t("routes.create_vacancy")}
                        </CardTitle>
                        <CardDescription>
                            {t("routes.vacancies")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                {/* Position Selection */}
                                <Field>
                                    <FieldLabel>{t("routes.positions")}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="position_id"
                                            control={control}
                                            rules={{ required: "validation.required" }}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={t("actions.select_department")}>
                                                            {currentSelectedPosition ? (currentSelectedPosition.name_localized || currentSelectedPosition.name?.en) : undefined}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {positionsList.map((pos) => (
                                                            <SelectItem key={pos.id} value={String(pos.id)}>
                                                                {pos.name_localized || pos.name?.en}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.position_id && (
                                            <FieldError>{t(errors.position_id.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Dummy column placeholder to balance the grid if needed, or we let Title go next */}
                                {/* Title Field */}
                                <Field>
                                    <FieldLabel>{t("attributes.title")}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("title", { required: "validation.required" })}
                                            placeholder={t("attributes.title")}
                                        />
                                        {errors.title && (
                                            <FieldError>{t(errors.title.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Description Field */}
                                <Field className="md:col-span-2">
                                    <FieldLabel>{t("attributes.description")}</FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            {...register("description", { required: "validation.required" })}
                                            placeholder={t("attributes.description")}
                                            rows={3}
                                        />
                                        {errors.description && (
                                            <FieldError>{t(errors.description.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Start Date Field */}
                                <Field>
                                    <FieldLabel>{t("attributes.start_date") || "Start Date"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="date"
                                            {...register("start_date", { required: "validation.required" })}
                                        />
                                        {errors.start_date && (
                                            <FieldError>{t(errors.start_date.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* End Date Field */}
                                <Field>
                                    <FieldLabel>{t("attributes.end_date") || "End Date"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="date"
                                            {...register("end_date", { required: "validation.required" })}
                                        />
                                        {errors.end_date && (
                                            <FieldError>{t(errors.end_date.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/vacancies">
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

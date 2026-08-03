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
    getCandidate,
    createCandidate,
    updateCandidate,
} from "@/actions/workspace/candidates.actions";
import { getVacancies, VacancyResource } from "@/actions/workspace/vacancies.actions";
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

interface CandidatesFormValues {
    vacancy_id: string;
    full_name: string;
    email: string;
    phone: string;
    cv: string;
    cover_letter: string;
    status: string;
}

export default function CandidatesForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const candidateId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!candidateId);
    const [vacanciesList, setVacanciesList] = useState<VacancyResource[]>([]);

    const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<CandidatesFormValues>({
        defaultValues: {
            vacancy_id: "",
            full_name: "",
            email: "",
            phone: "",
            cv: "",
            cover_letter: "",
            status: "pending",
        }
    });

    useEffect(() => {
        const loadInitialData = async () => {
            const vacRes = await getVacancies();
            if (vacRes.success && vacRes.data) {
                setVacanciesList(vacRes.data.data);
            }

            if (candidateId) {
                const res = await getCandidate(candidateId);
                if (res.success) {
                    const data = res.data;
                    setValue("vacancy_id", data.vacancy?.id ? String(data.vacancy.id) : String(data.vacancy_id || ""));
                    setValue("full_name", data.full_name || "");
                    setValue("email", data.email || "");
                    setValue("phone", data.phone || "");
                    setValue("cv", data.cv || "");
                    setValue("cover_letter", data.cover_letter || "");
                    setValue("status", data.status || "pending");
                } else {
                    toast.error(res.error);
                }
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [candidateId, setValue]);

    const onSubmit = (values: CandidatesFormValues) => {
        startTransition(async () => {
            const res = candidateId
                ? await updateCandidate(candidateId, values)
                : await createCandidate(values);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/candidates");
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
                            {candidateId ? t("routes.edit_candidate") : t("routes.create_candidate")}
                        </CardTitle>
                        <CardDescription>
                            {t("routes.candidates")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                {/* Vacancy select */}
                                <Field>
                                    <FieldLabel>{t("attributes.vacancy")}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="vacancy_id"
                                            control={control}
                                            rules={{ required: "validation.required" }}
                                            render={({ field }) => {
                                                const current = vacanciesList.find(v => String(v.id) === field.value);
                                                return (
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue>
                                                                {current ? current.title : undefined}
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {vacanciesList.map((vac) => (
                                                                <SelectItem key={vac.id} value={String(vac.id)}>
                                                                    {vac.title}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                );
                                            }}
                                        />
                                        {errors.vacancy_id && (
                                            <FieldError>{t(errors.vacancy_id.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Full Name Field */}
                                <Field>
                                    <FieldLabel>{t("attributes.full_name")}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("full_name", { required: "validation.required" })}
                                        />
                                        {errors.full_name && (
                                            <FieldError>{t(errors.full_name.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Email Field */}
                                <Field>
                                    <FieldLabel>{t("attributes.email")}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="email"
                                            {...register("email", { required: "validation.required" })}
                                        />
                                        {errors.email && (
                                            <FieldError>{t(errors.email.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Phone Field */}
                                <Field>
                                    <FieldLabel>{t("attributes.phone")}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("phone")} />
                                        {errors.phone && (
                                            <FieldError>{t(errors.phone.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* CV Field */}
                                <Field>
                                    <FieldLabel>{t("attributes.cv")}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("cv")}
                                            placeholder="https://example.com/cv.pdf"
                                        />
                                        {errors.cv && (
                                            <FieldError>{t(errors.cv.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Status select */}
                                <Field>
                                    <FieldLabel>{t("attributes.status")}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue>
                                                            {field.value ? t(`attributes.${field.value}`) : undefined}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">{t("attributes.pending")}</SelectItem>
                                                        <SelectItem value="accepted">{t("attributes.accepted")}</SelectItem>
                                                        <SelectItem value="rejected">{t("attributes.rejected")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Cover Letter Field */}
                                <Field className="md:col-span-2">
                                    <FieldLabel>{t("attributes.cover_letter")}</FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            {...register("cover_letter")}
                                            rows={4}
                                        />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/candidates">
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

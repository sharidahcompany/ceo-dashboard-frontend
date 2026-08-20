"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, X, Save, Plus, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    getCandidate,
    createCandidate,
    updateCandidate,
    syncExperiences,
    JobApplicationData,
    ExperienceEntry,
} from "@/actions/workspace/candidates.actions";
import { getVacancies, VacancyResource } from "@/actions/workspace/vacancies.actions";
import { SelectUser } from "@/components/ui/select-user";
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
    user_id: string;
    status: string;
    file: File | undefined;
    id_number: string;
    address: string;
    nationality: string;
    date_of_birth: string;
    gender: string;
    marital_status: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    experiences: ExperienceEntry[];
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

    const { handleSubmit, setValue, control, register, formState: { errors } } = useForm<CandidatesFormValues>({
        defaultValues: {
            vacancy_id: "",
            user_id: "",
            status: "pending",
            file: undefined,
            id_number: "",
            address: "",
            nationality: "",
            date_of_birth: "",
            gender: "",
            marital_status: "",
            emergency_contact_name: "",
            emergency_contact_phone: "",
            experiences: [],
        }
    });

    const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({
        control,
        name: "experiences",
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
                    setValue("user_id", data.user_id ? String(data.user_id) : "");
                    setValue("status", data.status || "pending");
                    setValue("id_number", data.id_number || "");
                    setValue("address", data.address || "");
                    setValue("nationality", data.nationality || "");
                    setValue("date_of_birth", data.date_of_birth || "");
                    setValue("gender", data.gender || "");
                    setValue("marital_status", data.marital_status || "");
                    setValue("emergency_contact_name", data.emergency_contact_name || "");
                    setValue("emergency_contact_phone", data.emergency_contact_phone || "");
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
            const payload: JobApplicationData = {
                vacancy_id: values.vacancy_id,
                // Only sent on create — this is who the referral is for.
                // Reassigning the applicant on an existing application isn't
                // supported (nor meaningful once they may have already
                // started an interview/offer process under their own id).
                user_id: candidateId ? undefined : values.user_id,
                status: values.status,
                file: values.file,
                id_number: values.id_number || undefined,
                address: values.address || undefined,
                nationality: values.nationality || undefined,
                date_of_birth: values.date_of_birth || undefined,
                gender: values.gender || undefined,
                marital_status: values.marital_status || undefined,
                emergency_contact_name: values.emergency_contact_name || undefined,
                emergency_contact_phone: values.emergency_contact_phone || undefined,
            };

            const res = candidateId
                ? await updateCandidate(candidateId, payload)
                : await createCandidate(payload);

            if (!res.success) {
                toast.error(res.error);
                return;
            }

            // The candidate's own user_id — selected on the form on create,
            // read back from the loaded application (via setValue) on edit.
            if (values.user_id && values.experiences.length > 0) {
                const expRes = await syncExperiences(values.user_id, values.experiences);
                if (!expRes.success) {
                    toast.error(expRes.error);
                    return;
                }
            }

            toast.success(res.message || t("success"));
            router.push("/hr/candidates");
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

                                {/* Applicant — only set on create; the candidate's own account, not editable afterward */}
                                {!candidateId && (
                                    <Field>
                                        <FieldLabel>{t("attributes.candidate") || "Candidate"}</FieldLabel>
                                        <FieldContent>
                                            <SelectUser<CandidatesFormValues>
                                                control={control}
                                                name="user_id"
                                                isTenantOnly
                                            />
                                            {errors.user_id && (
                                                <FieldError>{t(errors.user_id.message!)}</FieldError>
                                            )}
                                        </FieldContent>
                                    </Field>
                                )}

                                {/* CV upload */}
                                <Field>
                                    <FieldLabel>{t("attributes.cv")}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="file"
                                            control={control}
                                            render={({ field: { onChange, onBlur, name, ref } }) => (
                                                <Input
                                                    type="file"
                                                    accept="application/pdf"
                                                    name={name}
                                                    ref={ref}
                                                    onBlur={onBlur}
                                                    onChange={(e) => onChange(e.target.files?.[0])}
                                                />
                                            )}
                                        />
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

                                {/* Profile fields */}
                                <Field>
                                    <FieldLabel>{t("attributes.id_number") || "ID Number"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("id_number")} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel>{t("attributes.address") || "Address"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("address")} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel>{t("attributes.nationality") || "Nationality"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("nationality")} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel>{t("attributes.date_of_birth") || "Date of Birth"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="date" {...register("date_of_birth")} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel>{t("attributes.gender") || "Gender"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("gender")} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel>{t("attributes.marital_status") || "Marital Status"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("marital_status")} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel>{t("attributes.emergency_contact_name") || "Emergency Contact Name"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("emergency_contact_name")} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel>{t("attributes.emergency_contact_phone") || "Emergency Contact Phone"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("emergency_contact_phone")} />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                {/* Experiences */}
                <Card className="w-full">
                    <CardHeader className="border-b flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t("attributes.experience") || "Experience"}</CardTitle>
                            <CardDescription>
                                {t("messages.hr.experience_description") || "Work or education history"}
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() =>
                                appendExperience({
                                    title: "",
                                    organization: "",
                                    description: "",
                                    start_date: "",
                                    end_date: "",
                                    type: "work",
                                })
                            }
                        >
                            <Plus className="size-4" />
                            {t("buttons.add") || "Add"}
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {experienceFields.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                {t("messages.hr.no_experiences") || "No experience entries yet."}
                            </p>
                        )}
                        {experienceFields.map((field, index) => (
                            <div key={field.id} className="rounded-lg border p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        #{index + 1}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeExperience(index)}
                                    >
                                        <Trash2 className="size-4 text-destructive" />
                                    </Button>
                                </div>
                                <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                    <Field>
                                        <FieldLabel>{t("attributes.title") || "Title"}</FieldLabel>
                                        <FieldContent>
                                            <Input {...register(`experiences.${index}.title`, { required: "validation.required" })} />
                                            {errors.experiences?.[index]?.title && (
                                                <FieldError>{t(errors.experiences[index]!.title!.message!)}</FieldError>
                                            )}
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel>{t("attributes.organization") || "Organization"}</FieldLabel>
                                        <FieldContent>
                                            <Input {...register(`experiences.${index}.organization`, { required: "validation.required" })} />
                                            {errors.experiences?.[index]?.organization && (
                                                <FieldError>{t(errors.experiences[index]!.organization!.message!)}</FieldError>
                                            )}
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel>{t("attributes.type") || "Type"}</FieldLabel>
                                        <FieldContent>
                                            <Controller
                                                name={`experiences.${index}.type`}
                                                control={control}
                                                render={({ field: typeField }) => (
                                                    <Select value={typeField.value} onValueChange={typeField.onChange}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue>
                                                                {typeField.value ? (t(`attributes.${typeField.value}`) || typeField.value) : undefined}
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="work">{t("attributes.work") || "Work"}</SelectItem>
                                                            <SelectItem value="education">{t("attributes.education") || "Education"}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel>{t("attributes.start_date") || "Start Date"}</FieldLabel>
                                        <FieldContent>
                                            <Input type="date" {...register(`experiences.${index}.start_date`, { required: "validation.required" })} />
                                            {errors.experiences?.[index]?.start_date && (
                                                <FieldError>{t(errors.experiences[index]!.start_date!.message!)}</FieldError>
                                            )}
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel>{t("attributes.end_date") || "End Date"}</FieldLabel>
                                        <FieldContent>
                                            <Input type="date" {...register(`experiences.${index}.end_date`)} />
                                        </FieldContent>
                                    </Field>
                                    <Field className="md:col-span-2">
                                        <FieldLabel>{t("attributes.description") || "Description"}</FieldLabel>
                                        <FieldContent>
                                            <Input {...register(`experiences.${index}.description`)} />
                                        </FieldContent>
                                    </Field>
                                </FieldGroup>
                            </div>
                        ))}
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

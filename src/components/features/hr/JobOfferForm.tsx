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
    getJobOffer,
    createJobOffer,
    updateJobOffer,
} from "@/actions/workspace/job-offers.actions";
import { getCandidates, JobApplicationResource } from "@/actions/workspace/candidates.actions";
import { getPositions, PositionResource } from "@/actions/workspace/positions.actions";
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

interface JobOfferFormValues {
    position_id: string;
    user_id: string;
    job_application_id: string;
    salary: string;
    start_date: string;
    benefits: string;
}

export default function JobOfferForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const offerId = (params?.id as string) || undefined;
    const jobApplicationId = searchParams?.get("job_application_id") || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!offerId);
    const [positionsList, setPositionsList] = useState<PositionResource[]>([]);
    const [applications, setApplications] = useState<JobApplicationResource[]>([]);
    const [loadingApplications, setLoadingApplications] = useState(false);

    const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<JobOfferFormValues>({
        defaultValues: {
            position_id: "",
            user_id: "",
            job_application_id: jobApplicationId || "",
            salary: "",
            start_date: "",
            benefits: "",
        }
    });

    const selectedPositionId = watch("position_id");
    const selectedUserId = watch("user_id");

    // Every offer must trace back to the application it was made for —
    // otherwise "Convert to Employee" has no accepted offer to find later.
    // Once a candidate is picked, load their applications so HR can link one.
    useEffect(() => {
        if (!selectedUserId) return;

        setLoadingApplications(true);
        getCandidates(`filter[user_id]=${selectedUserId}&per_page=100`).then((res) => {
            setLoadingApplications(false);
            if (res.success) {
                setApplications(res.data.data);
                // A newly-picked candidate (create mode) invalidates whatever
                // application was pre-selected for a different candidate.
                if (!offerId && jobApplicationId && !res.data.data.some((a) => String(a.id) === jobApplicationId)) {
                    setValue("job_application_id", "");
                }
            }
        });
    }, [selectedUserId, offerId, jobApplicationId, setValue]);

    useEffect(() => {
        const loadInitialData = async () => {
            const posRes = await getPositions();
            if (posRes.success && posRes.data) {
                setPositionsList(posRes.data.data);
            }

            if (offerId) {
                const offerRes = await getJobOffer(offerId);
                if (offerRes.success) {
                    const offer = offerRes.data;
                    setValue("position_id", offer.position?.id ? String(offer.position.id) : "");
                    setValue("user_id", offer.user?.id ? String(offer.user.id) : "");
                    setValue(
                        "job_application_id",
                        offer.job_application?.id ? String(offer.job_application.id) : "",
                    );
                    setValue("salary", offer.salary || "");
                    setValue("start_date", offer.start_date || "");
                    setValue("benefits", offer.benefits || "");
                } else {
                    toast.error(offerRes.error);
                }
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [offerId, setValue]);

    const onSubmit = (values: JobOfferFormValues) => {
        startTransition(async () => {
            const payload = { ...values };
            const res = offerId
                ? await updateJobOffer(offerId, payload)
                : await createJobOffer(payload);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/job-offers");
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
                            {offerId ? t("routes.edit_job_offer") : t("routes.create_job_offer")}
                        </CardTitle>
                        <CardDescription>
                            {t("routes.job_offer")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                <Field>
                                    <FieldLabel>{t("attributes.candidate") || "Candidate"}</FieldLabel>
                                    <FieldContent>
                                        <SelectUser<JobOfferFormValues>
                                            control={control}
                                            name="user_id"
                                            isTenantOnly
                                        />
                                        {errors.user_id && (
                                            <FieldError>{t(errors.user_id.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.job_application") || "Application"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="job_application_id"
                                            control={control}
                                            rules={{ required: "validation.required" }}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    disabled={!selectedUserId || loadingApplications}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue
                                                            placeholder={
                                                                !selectedUserId
                                                                    ? t("messages.hr.pick_candidate_first") ||
                                                                      "Pick a candidate first"
                                                                    : t("messages.hr.pick_application") ||
                                                                      "Select the application this offer is for"
                                                            }
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {applications.map((app) => (
                                                            <SelectItem key={app.id} value={String(app.id)}>
                                                                {app.vacancy?.title || `#${app.id}`}
                                                                {app.status_label ? ` — ${app.status_label}` : ""}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.job_application_id && (
                                            <FieldError>{t(errors.job_application_id.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

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

                                <Field>
                                    <FieldLabel>{t("attributes.salary") || "Salary"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            {...register("salary", { required: "validation.required" })}
                                            placeholder={t("attributes.salary") || "Salary"}
                                        />
                                        {errors.salary && (
                                            <FieldError>{t(errors.salary.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.start_date") || "Start Date"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="date"
                                            {...register("start_date")}
                                        />
                                        {errors.start_date && (
                                            <FieldError>{t(errors.start_date.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                <Field className="md:col-span-2">
                                    <FieldLabel>{t("attributes.benefits") || "Benefits"}</FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            {...register("benefits")}
                                            placeholder={t("attributes.benefits") || "Benefits"}
                                            rows={3}
                                        />
                                        {errors.benefits && (
                                            <FieldError>{t(errors.benefits.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/job-offers">
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

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
    getInterview,
    createInterview,
    updateInterview,
    JobInterviewResource
} from "@/actions/workspace/interviews.actions";
import { SelectUser } from "@/components/ui/select-user";
import { MultiSelectUser } from "@/components/ui/multi-select-user";
import { UserResource } from "@/actions/workspace/user.actions";
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

interface InterviewsFormValues {
    user_id: string;
    interviewers_id: string[];
    scheduled_at: string;
    interview_type: "online" | "on_site";
    meeting_link: string;
    location: string;
    status: string;
    hr_notes: string;
}

export default function InterviewsForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const interviewId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!interviewId);
    
    // Initial states for user / interviewers to prevent combobox pop issues when editing
    const [initialUser, setInitialUser] = useState<UserResource | null>(null);
    const [initialInterviewers, setInitialInterviewers] = useState<UserResource[]>([]);

    const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<InterviewsFormValues>({
        defaultValues: {
            user_id: "",
            interviewers_id: [],
            scheduled_at: "",
            interview_type: "online",
            meeting_link: "",
            location: "",
            status: "scheduled",
            hr_notes: "",
        }
    });

    const selectedType = watch("interview_type");
    const selectedStatus = watch("status");

    useEffect(() => {
        const loadInitialData = async () => {
            if (interviewId) {
                const res = await getInterview(interviewId);
                if (res.success) {
                    const data = res.data;
                    
                    // Parse candidate user
                    if (data.user) {
                        const candidateUser: UserResource = {
                            id: String(data.user.id),
                            first_name: data.user.full_name.split(" ")[0] || "",
                            last_name: data.user.full_name.split(" ").slice(1).join(" ") || "",
                            full_name: data.user.full_name,
                            avatar: data.user.avatar,
                            email: "",
                        };
                        setInitialUser(candidateUser);
                        setValue("user_id", String(data.user.id));
                    }

                    // Parse interviewers
                    if (data.interviewers) {
                        const mappedInts: UserResource[] = data.interviewers.map(item => ({
                            id: String(item.id),
                            first_name: item.full_name.split(" ")[0] || "",
                            last_name: item.full_name.split(" ").slice(1).join(" ") || "",
                            full_name: item.full_name,
                            avatar: item.avatar,
                            email: "",
                        }));
                        setInitialInterviewers(mappedInts);
                        setValue("interviewers_id", data.interviewers.map(i => String(i.id)));
                    }

                    // Convert ISO format to input datetime-local format: YYYY-MM-DDTHH:MM
                    if (data.scheduled_at) {
                        const dateObj = new Date(data.scheduled_at);
                        const timezoneOffset = dateObj.getTimezoneOffset() * 60000;
                        const localISOTime = new Date(dateObj.getTime() - timezoneOffset).toISOString().slice(0, 16);
                        setValue("scheduled_at", localISOTime);
                    }

                    setValue("interview_type", data.interview_type);
                    setValue("meeting_link", data.meeting_link || "");
                    setValue("location", data.location || "");
                    setValue("status", data.status);
                    setValue("hr_notes", data.hr_notes || "");
                } else {
                    toast.error(res.error);
                }
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [interviewId, setValue]);

    const onSubmit = (values: InterviewsFormValues) => {
        startTransition(async () => {
            const payload = {
                ...values,
                scheduled_at: values.scheduled_at ? values.scheduled_at.replace("T", " ") : "",
            };

            const res = interviewId
                ? await updateInterview(interviewId, payload as any)
                : await createInterview(payload as any);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/interviews");
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
                            {interviewId ? t("routes.edit_interview") : t("routes.create_interview")}
                        </CardTitle>
                        <CardDescription>
                            {t("routes.interviews")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                {/* Candidate select */}
                                <Field>
                                    <FieldLabel>{t("routes.candidates")}</FieldLabel>
                                    <FieldContent>
                                        <SelectUser
                                            control={control}
                                            name="user_id"
                                            initialUser={initialUser}
                                            isTenantOnly={true}
                                        />
                                        {errors.user_id && (
                                            <FieldError>{t(errors.user_id.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Interviewers select */}
                                <Field>
                                    <FieldLabel>{t("routes.employees")}</FieldLabel>
                                    <FieldContent>
                                        <MultiSelectUser
                                            control={control}
                                            name="interviewers_id"
                                            initialUsers={initialInterviewers}
                                        />
                                        {errors.interviewers_id && (
                                            <FieldError>{t(errors.interviewers_id.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Scheduled At Field */}
                                <Field>
                                    <FieldLabel>{t("attributes.scheduled_at")}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="datetime-local"
                                            {...register("scheduled_at", { required: "validation.required" })}
                                        />
                                        {errors.scheduled_at && (
                                            <FieldError>{t(errors.scheduled_at.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Interview Type select */}
                                <Field>
                                    <FieldLabel>{t("attributes.interview_type")}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="interview_type"
                                            control={control}
                                            rules={{ required: "validation.required" }}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue>
                                                            {field.value ? t(`attributes.${field.value}`) : undefined}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="online">{t("attributes.online")}</SelectItem>
                                                        <SelectItem value="on_site">{t("attributes.on_site")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.interview_type && (
                                            <FieldError>{t(errors.interview_type.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Conditional Link or Location Field */}
                                {selectedType === "online" && (
                                    <Field>
                                        <FieldLabel>{t("attributes.meeting_link")}</FieldLabel>
                                        <FieldContent>
                                            <Input
                                                {...register("meeting_link", { required: "validation.required" })}
                                                placeholder="https://example.com/meeting"
                                            />
                                            {errors.meeting_link && (
                                                <FieldError>{t(errors.meeting_link.message!)}</FieldError>
                                            )}
                                        </FieldContent>
                                    </Field>
                                )}

                                {selectedType === "on_site" && (
                                    <Field>
                                        <FieldLabel>{t("attributes.location")}</FieldLabel>
                                        <FieldContent>
                                            <Input
                                                {...register("location", { required: "validation.required" })}
                                                placeholder="Main Headquarters"
                                            />
                                            {errors.location && (
                                                <FieldError>{t(errors.location.message!)}</FieldError>
                                            )}
                                        </FieldContent>
                                    </Field>
                                )}

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
                                                        <SelectItem value="scheduled">{t("attributes.scheduled")}</SelectItem>
                                                        <SelectItem value="canceled">{t("attributes.canceled")}</SelectItem>
                                                        <SelectItem value="rescheduled">{t("attributes.rescheduled")}</SelectItem>
                                                        <SelectItem value="accepted">{t("attributes.accepted")}</SelectItem>
                                                        <SelectItem value="rejected">{t("attributes.rejected")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* HR Notes Field */}
                                <Field className="md:col-span-2">
                                    <FieldLabel>{t("attributes.notes")}</FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            {...register("hr_notes")}
                                            placeholder="..."
                                            rows={3}
                                        />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/interviews">
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

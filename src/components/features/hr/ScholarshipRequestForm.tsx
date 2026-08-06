"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, NumericInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, X, Save } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    getScholarshipRequest,
    createScholarshipRequest,
    updateScholarshipRequest,
    getAvailableScholarships,
    AvailableScholarshipResource,
    ScholarshipRequestData
} from "@/actions/workspace/scholarships.actions";
import { SelectUser } from "@/components/ui/select-user";
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

interface ScholarshipRequestFormValues {
    user_id: string;
    scholarship_id: string;
    title: string;
    description: string;
    price: string;
    discount_percentage: string;
    duration: string;
    status: "pending" | "approved" | "rejected";
}

export default function ScholarshipRequestForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const requestId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!requestId);
    const [initialUser, setInitialUser] = useState<UserResource | null>(null);
    const [scholarshipsList, setScholarshipsList] = useState<AvailableScholarshipResource[]>([]);

    const { register, handleSubmit, setValue, control, watch, formState: { errors } } = useForm<ScholarshipRequestFormValues>({
        defaultValues: {
            user_id: "",
            scholarship_id: "",
            title: "",
            description: "",
            price: "",
            discount_percentage: "",
            duration: "",
            status: "pending",
        }
    });

    const selectedScholarshipId = watch("scholarship_id");

    // Fetch scholarships list and request initial details
    useEffect(() => {
        const loadInitialData = async () => {
            // Load available scholarships
            const sRes = await getAvailableScholarships();
            if (sRes.success && sRes.data) {
                setScholarshipsList(sRes.data.data);
            }

            if (requestId) {
                const res = await getScholarshipRequest(requestId);
                if (res.success) {
                    const data = res.data;
                    if (data.user) {
                        setInitialUser(data.user);
                        setValue("user_id", String(data.user.id));
                    }
                    setValue("scholarship_id", data.scholarship_id ? String(data.scholarship_id) : "");
                    setValue("title", data.title || "");
                    setValue("description", data.description || "");
                    setValue("price", data.price !== undefined ? String(data.price) : "");
                    setValue("discount_percentage", data.discount_percentage !== undefined ? String(data.discount_percentage) : "");
                    setValue("duration", data.duration !== undefined ? String(data.duration) : "");
                    setValue("status", data.status as any || "pending");
                } else {
                    toast.error(res.error);
                }
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [requestId, setValue]);

    // Handle auto-filling details on scholarship selection
    useEffect(() => {
        if (selectedScholarshipId && scholarshipsList.length > 0) {
            const selected = scholarshipsList.find(s => String(s.id) === selectedScholarshipId);
            if (selected) {
                setValue("title", selected.title || "");
                setValue("description", selected.description || "");
                setValue("price", selected.price !== undefined ? String(selected.price) : "");
                setValue("discount_percentage", selected.discount_percentage !== undefined ? String(selected.discount_percentage) : "");
                setValue("duration", selected.duration || "");
            }
        }
    }, [selectedScholarshipId, scholarshipsList, setValue]);

    const onSubmit = (values: ScholarshipRequestFormValues) => {
        startTransition(async () => {
            const payload: ScholarshipRequestData = {
                user_id: values.user_id,
                scholarship_id: values.scholarship_id ? Number(values.scholarship_id) : null,
                title: values.title || null,
                description: values.description || null,
                price: Number(values.price),
                discount_percentage: Number(values.discount_percentage),
                duration: values.duration || null,
                status: values.status,
            };

            const res = requestId
                ? await updateScholarshipRequest(requestId, payload)
                : await createScholarshipRequest(payload);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/scholarships/scholarship-requests");
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

    const currentSelectedScholarship = scholarshipsList.find(s => String(s.id) === selectedScholarshipId);

    return (
        <div className="space-y-6 w-full">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="w-full">
                    <CardHeader className="border-b">
                        <CardTitle>
                            {requestId ? t("routes.edit_scholarship_request") || "Edit Scholarship Request" : t("routes.create_scholarship_request") || "Submit Scholarship Request"}
                        </CardTitle>
                        <CardDescription>
                            {t("routes.scholarship_requests") || "Submit or manage organization scholarship requests"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                {/* Employee selection */}
                                <Field>
                                    <FieldLabel>{t("attributes.employee") || "Employee"}</FieldLabel>
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

                                {/* Scholarship Template selection */}
                                <Field>
                                    <FieldLabel>{t("routes.available_scholarships") || "Scholarship Program"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="scholarship_id"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={t("attributes.custom") || "Custom Scholarship"}>
                                                            {currentSelectedScholarship ? currentSelectedScholarship.title : undefined}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">{t("attributes.custom") || "Custom Scholarship (Free Entry)"}</SelectItem>
                                                        {scholarshipsList.map((sch) => (
                                                            <SelectItem key={sch.id} value={String(sch.id)}>
                                                                {sch.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                </Field>

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
                                        <NumericInput
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
                                        <NumericInput
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
                                            {...register("duration")}
                                            placeholder={t("attributes.duration") || "e.g., 1 Year, 6 Months"}
                                        />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/scholarships/scholarship-requests">
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

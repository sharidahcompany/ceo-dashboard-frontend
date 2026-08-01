"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, X, Save } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    getMission,
    createMission,
    updateMission,
    MissionData,
} from "@/actions/workspace/missions.actions";
import { UserResource } from "@/actions/workspace/user.actions";
import { MultiSelectUser } from "@/components/ui/multi-select-user";
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
    FieldSet,
} from "@/components/ui/field";

interface MissionFormValues {
    title: string;
    description: string;
    start_datetime: string;
    end_datetime: string;
    actual_start_datetime: string;
    actual_end_datetime: string;
    expense_amount: string;
    assignee_ids: string[];
    status: string;
    approval_status: string;
}

export default function MissionForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const missionId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!missionId);
    const [initialAssignees, setInitialAssignees] = useState<UserResource[]>([]);

    const statusOptions = [
        { value: "pending", label: t("attributes.pending") || "Pending" },
        { value: "in_progress", label: t("attributes.in_progress") || "In Progress" },
        { value: "completed", label: t("attributes.completed") || "Completed" },
        { value: "cancelled", label: t("attributes.cancelled") || "Cancelled" },
    ];

    const approvalStatusOptions = [
        { value: "pending", label: t("attributes.pending") || "Pending" },
        { value: "approved", label: t("attributes.approved") || "Approved" },
        { value: "rejected", label: t("attributes.rejected") || "Rejected" },
    ];

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<MissionFormValues>({
        defaultValues: {
            title: "",
            description: "",
            start_datetime: "",
            end_datetime: "",
            actual_start_datetime: "",
            actual_end_datetime: "",
            expense_amount: "",
            assignee_ids: [],
            status: "pending",
            approval_status: "pending",
        },
    });

    useEffect(() => {
        const loadInitialData = async () => {
            if (missionId) {
                const res = await getMission(missionId);
                if (res.success) {
                    const data = res.data;

                    setValue("title", data.title || "");
                    setValue("description", data.description || "");

                    // Format datetime to datetime-local input format (YYYY-MM-DDTHH:MM)
                    const toLocalInput = (dt?: string | null) =>
                        dt ? dt.replace(" ", "T").substring(0, 16) : "";

                    setValue("start_datetime", toLocalInput(data.start_datetime));
                    setValue("end_datetime", toLocalInput(data.end_datetime));
                    setValue("actual_start_datetime", toLocalInput(data.actual_start_datetime));
                    setValue("actual_end_datetime", toLocalInput(data.actual_end_datetime));
                    setValue("expense_amount", data.expense_amount ?? "");
                    setValue("status", data.status?.value || "pending");
                    setValue("approval_status", data.approval_status?.value || "pending");

                    if (data.assignees && data.assignees.length > 0) {
                        setInitialAssignees(data.assignees);
                        setValue("assignee_ids", (data.assignee_ids as string[]) ?? []);
                    }
                } else {
                    toast.error(res.error);
                }
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [missionId, setValue]);

    const onSubmit = (values: MissionFormValues) => {
        startTransition(async () => {
            const payload: MissionData = {
                title: values.title,
                description: values.description || null,
                start_datetime: values.start_datetime
                    ? values.start_datetime.replace("T", " ") + ":00"
                    : null,
                end_datetime: values.end_datetime
                    ? values.end_datetime.replace("T", " ") + ":00"
                    : null,
                actual_start_datetime: values.actual_start_datetime
                    ? values.actual_start_datetime.replace("T", " ") + ":00"
                    : null,
                actual_end_datetime: values.actual_end_datetime
                    ? values.actual_end_datetime.replace("T", " ") + ":00"
                    : null,
                expense_amount: values.expense_amount ? Number(values.expense_amount) : null,
                assignee_ids: values.assignee_ids,
                status: values.status,
                approval_status: values.approval_status,
            };

            const res = missionId
                ? await updateMission(missionId, payload)
                : await createMission(payload);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/missions");
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
                            {missionId
                                ? t("routes.edit_mission") || "Edit Mission"
                                : t("routes.create_mission") || "Create Mission"}
                        </CardTitle>
                        <CardDescription>
                            {t("messages.hr.mission_description") || "Fill in the mission details below"}
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
                                            placeholder={t("attributes.title") || "Mission title"}
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
                                            {...register("description")}
                                            placeholder={t("attributes.description") || "Mission description"}
                                            rows={3}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Start DateTime */}
                                <Field>
                                    <FieldLabel>{t("attributes.start_datetime") || "Start Date & Time"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="datetime-local"
                                            {...register("start_datetime")}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* End DateTime */}
                                <Field>
                                    <FieldLabel>{t("attributes.end_datetime") || "End Date & Time"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="datetime-local"
                                            {...register("end_datetime")}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Actual Start DateTime */}
                                <Field>
                                    <FieldLabel>{t("attributes.actual_start_datetime") || "Actual Start"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="datetime-local"
                                            {...register("actual_start_datetime")}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Actual End DateTime */}
                                <Field>
                                    <FieldLabel>{t("attributes.actual_end_datetime") || "Actual End"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="datetime-local"
                                            {...register("actual_end_datetime")}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Expense Amount */}
                                <Field>
                                    <FieldLabel>{t("attributes.expense_amount") || "Expense Amount"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...register("expense_amount")}
                                            placeholder="0.00"
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Status */}
                                <Field>
                                    <FieldLabel>{t("attributes.status") || "Status"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => {
                                                const selectedLabel = statusOptions.find(
                                                    (opt) => opt.value === field.value
                                                )?.label;
                                                return (
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue>{selectedLabel}</SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {statusOptions.map((opt) => (
                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                );
                                            }}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Approval Status */}
                                <Field>
                                    <FieldLabel>{t("attributes.approval_status") || "Approval Status"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="approval_status"
                                            control={control}
                                            render={({ field }) => {
                                                const selectedLabel = approvalStatusOptions.find(
                                                    (opt) => opt.value === field.value
                                                )?.label;
                                                return (
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue>{selectedLabel}</SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {approvalStatusOptions.map((opt) => (
                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                );
                                            }}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Assignees */}
                                <Field className="md:col-span-2">
                                    <FieldLabel>{t("attributes.assignees") || "Assignees"}</FieldLabel>
                                    <FieldContent>
                                        <MultiSelectUser
                                            control={control}
                                            name="assignee_ids"
                                            initialUsers={initialAssignees}
                                        />
                                    </FieldContent>
                                </Field>

                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/missions">
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

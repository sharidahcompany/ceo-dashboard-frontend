"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, X, Save } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    getShift,
    createShift,
    updateShift,
    ShiftResource,
    ShiftData
} from "@/actions/workspace/shifts.actions";
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
import { Checkbox } from "@/components/ui/checkbox";

interface ShiftFormValues {
    name: string;
    work_days: string[];
    start_time: string;
    end_time: string;
    grace_period: number;
    overtime_allowed: boolean;
    overtime_rate: number;
    deduction_rate: number;
    user_ids: string[];
}

export default function ShiftForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const shiftId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!shiftId);
    const [initialUsers, setInitialUsers] = useState<UserResource[]>([]);

    const daysOptions = [
        { value: "0", label: t("weekdays.sunday") || "Sunday" },
        { value: "1", label: t("weekdays.monday") || "Monday" },
        { value: "2", label: t("weekdays.tuesday") || "Tuesday" },
        { value: "3", label: t("weekdays.wednesday") || "Wednesday" },
        { value: "4", label: t("weekdays.thursday") || "Thursday" },
        { value: "5", label: t("weekdays.friday") || "Friday" },
        { value: "6", label: t("weekdays.saturday") || "Saturday" },
    ];

    const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<ShiftFormValues>({
        defaultValues: {
            name: "",
            work_days: [],
            start_time: "",
            end_time: "",
            grace_period: 0,
            overtime_allowed: true,
            overtime_rate: 1.0,
            deduction_rate: 1.0,
            user_ids: [],
        }
    });

    useEffect(() => {
        const loadInitialData = async () => {
            if (shiftId) {
                const res = await getShift(shiftId);
                if (res.success) {
                    const data = res.data;
                    setValue("name", data.name || "");
                    
                    // Map days back to string values
                    if (data.work_days) {
                        setValue("work_days", data.work_days.map(d => String(d.value)));
                    }

                    // Format H:i:s or H:i to H:i for time inputs
                    if (data.start_time) {
                        setValue("start_time", data.start_time.substring(0, 5));
                    }
                    if (data.end_time) {
                        setValue("end_time", data.end_time.substring(0, 5));
                    }

                    setValue("grace_period", Number(data.grace_period ?? 0));
                    setValue("overtime_allowed", !!data.overtime_allowed);
                    setValue("overtime_rate", Number(data.overtime_rate ?? 1.0));
                    setValue("deduction_rate", Number(data.deduction_rate ?? 1.0));

                    if (data.users) {
                        setInitialUsers(data.users);
                        setValue("user_ids", data.users.map(u => String(u.id)));
                    }
                } else {
                    toast.error(res.error);
                }
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [shiftId, setValue]);

    const onSubmit = (values: ShiftFormValues) => {
        startTransition(async () => {
            const payload: ShiftData = {
                name: values.name,
                work_days: values.work_days,
                start_time: values.start_time,
                end_time: values.end_time,
                grace_period: Number(values.grace_period),
                overtime_allowed: values.overtime_allowed,
                overtime_rate: Number(values.overtime_rate),
                deduction_rate: Number(values.deduction_rate),
                user_ids: values.user_ids,
            };

            const res = shiftId
                ? await updateShift(shiftId, payload)
                : await createShift(payload);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/shifts");
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
                            {shiftId ? t("routes.edit_shift") || "Edit Shift" : t("routes.create_shift") || "Create Shift"}
                        </CardTitle>
                        <CardDescription>
                            {t("routes.shifts") || "Manage organization work shifts"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                {/* Name */}
                                <Field>
                                    <FieldLabel>{t("attributes.name") || "Shift Name"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("name", { required: "validation.required" })}
                                            placeholder={t("attributes.name") || "Shift Name"}
                                        />
                                        {errors.name && (
                                            <FieldError>{t(errors.name.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Work Days Selection */}
                                <Field className="md:col-span-2">
                                    <FieldLabel>{t("attributes.work_days") || "Work Days"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="work_days"
                                            control={control}
                                            render={({ field }) => {
                                                const currentDays = field.value || [];
                                                return (
                                                    <div className="flex flex-wrap gap-4 mt-2">
                                                        {daysOptions.map((day) => {
                                                            const isChecked = currentDays.includes(day.value);
                                                            return (
                                                                <label
                                                                    key={day.value}
                                                                    className="flex items-center space-x-2 cursor-pointer bg-secondary/50 px-3 py-1.5 rounded-md hover:bg-secondary transition"
                                                                >
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked) => {
                                                                            if (checked) {
                                                                                field.onChange([...currentDays, day.value]);
                                                                            } else {
                                                                                field.onChange(currentDays.filter(val => val !== day.value));
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span className="text-sm select-none">{day.label}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            }}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Start Time */}
                                <Field>
                                    <FieldLabel>{t("attributes.start_time") || "Start Time"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="time"
                                            {...register("start_time", { required: "validation.required" })}
                                        />
                                        {errors.start_time && (
                                            <FieldError>{t(errors.start_time.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* End Time */}
                                <Field>
                                    <FieldLabel>{t("attributes.end_time") || "End Time"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="time"
                                            {...register("end_time", { required: "validation.required" })}
                                        />
                                        {errors.end_time && (
                                            <FieldError>{t(errors.end_time.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Grace Period */}
                                <Field>
                                    <FieldLabel>{t("attributes.grace_period") || "Grace Period (Minutes)"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="number"
                                            {...register("grace_period", { valueAsNumber: true })}
                                            placeholder="0"
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Overtime Allowed */}
                                <Field>
                                    <FieldLabel>{t("attributes.overtime_allowed") || "Overtime Allowed"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="overtime_allowed"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value ? "true" : "false"}
                                                    onValueChange={(val) => field.onChange(val === "true")}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue>
                                                            {field.value ? (t("attributes.yes") || "Yes") : (t("attributes.no") || "No")}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">{t("attributes.yes") || "Yes"}</SelectItem>
                                                        <SelectItem value="false">{t("attributes.no") || "No"}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Overtime Rate */}
                                <Field>
                                    <FieldLabel>{t("attributes.overtime_rate") || "Overtime Rate (Multiplier)"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            {...register("overtime_rate", { valueAsNumber: true })}
                                            placeholder="1.0"
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Deduction Rate */}
                                <Field>
                                    <FieldLabel>{t("attributes.deduction_rate") || "Deduction Rate (Multiplier)"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            {...register("deduction_rate", { valueAsNumber: true })}
                                            placeholder="1.0"
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Users / Employees list selection */}
                                <Field className="md:col-span-2">
                                    <FieldLabel>{t("routes.employees") || "Assigned Employees"}</FieldLabel>
                                    <FieldContent>
                                        <MultiSelectUser
                                            control={control}
                                            name="user_ids"
                                            initialUsers={initialUsers}
                                        />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/shifts">
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
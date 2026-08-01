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
    getAttendance,
    createAttendance,
    updateAttendance,
    AttendanceResource,
    AttendanceData
} from "@/actions/workspace/attendance.actions";
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

interface AttendanceFormValues {
    user_id: string;
    attendance_date: string;
    shift_start_at: string;
    shift_end_at: string;
    check_in: string;
    check_out: string;
    late_minutes: number;
    overtime_minutes: number;
    status: string;
}

export default function AttendanceForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const attendanceId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!attendanceId);
    const [initialUser, setInitialUser] = useState<UserResource | null>(null);

    const statusOptions = [
        { value: "pending", label: t("attributes.pending") || "Pending" },
        { value: "present", label: t("attributes.present") || "Present" },
        { value: "late", label: t("attributes.late") || "Late" },
        { value: "absent", label: t("attributes.absent") || "Absent" },
        { value: "missed_checkout", label: t("attributes.missed_checkout") || "Missed Checkout" },
        { value: "weekend", label: t("attributes.weekend") || "Weekend" },
        { value: "holiday", label: t("attributes.holiday") || "Holiday" },
        { value: "leave_permission", label: t("attributes.leave_permission") || "Leave Permission" },
        { value: "mission", label: t("attributes.mission") || "Mission" },
    ];

    const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<AttendanceFormValues>({
        defaultValues: {
            user_id: "",
            attendance_date: "",
            shift_start_at: "",
            shift_end_at: "",
            check_in: "",
            check_out: "",
            late_minutes: 0,
            overtime_minutes: 0,
            status: "pending",
        }
    });

    useEffect(() => {
        const loadInitialData = async () => {
            if (attendanceId) {
                const res = await getAttendance(attendanceId);
                if (res.success) {
                    const data = res.data;
                    
                    if (data.user) {
                        setInitialUser(data.user);
                        setValue("user_id", String(data.user.id));
                    }

                    // Format dates to YYYY-MM-DD
                    if (data.attendance_date) {
                        setValue("attendance_date", data.attendance_date.substring(0, 10));
                    }

                    // Times format: HH:MM:SS or HH:MM to HH:MM
                    if (data.shift_start_at) {
                        setValue("shift_start_at", data.shift_start_at.substring(0, 5));
                    }
                    if (data.shift_end_at) {
                        setValue("shift_end_at", data.shift_end_at.substring(0, 5));
                    }
                    if (data.check_in) {
                        // Extract HH:MM from datetime string
                        const ciMatch = data.check_in.match(/(\d{2}):(\d{2})/);
                        setValue("check_in", ciMatch ? `${ciMatch[1]}:${ciMatch[2]}` : "");
                    }
                    if (data.check_out) {
                        const coMatch = data.check_out.match(/(\d{2}):(\d{2})/);
                        setValue("check_out", coMatch ? `${coMatch[1]}:${coMatch[2]}` : "");
                    }

                    setValue("late_minutes", Number(data.late_minutes ?? 0));
                    setValue("overtime_minutes", Number(data.overtime_minutes ?? 0));
                    setValue("status", data.status || "pending");
                } else {
                    toast.error(res.error);
                }
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [attendanceId, setValue]);

    const onSubmit = (values: AttendanceFormValues) => {
        startTransition(async () => {
            const payload: AttendanceData = {
                user_id: values.user_id,
                attendance_date: values.attendance_date || undefined,
                shift_start_at: values.shift_start_at || undefined,
                shift_end_at: values.shift_end_at || undefined,
                check_in: (values.check_in && values.attendance_date)
                    ? `${values.attendance_date} ${values.check_in}:00`
                    : null,
                check_out: (values.check_out && values.attendance_date)
                    ? `${values.attendance_date} ${values.check_out}:00`
                    : null,
                late_minutes: Number(values.late_minutes),
                overtime_minutes: Number(values.overtime_minutes),
                status: values.status,
            };

            const res = attendanceId
                ? await updateAttendance(attendanceId, payload)
                : await createAttendance(payload);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/attendance");
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
                            {attendanceId ? t("routes.edit_attendance") || "Edit Attendance" : t("routes.create_attendance") || "Record Attendance"}
                        </CardTitle>
                        <CardDescription>
                            {t("routes.attendance") || "Manage and record employee attendance manually"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                {/* Employee selection */}
                                <Field>
                                    <FieldLabel>{t("routes.employees") || "Employee"}</FieldLabel>
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

                                {/* Attendance Date */}
                                <Field>
                                    <FieldLabel>{t("attributes.date") || "Attendance Date"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="date"
                                            {...register("attendance_date")}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Shift Start time */}
                                <Field>
                                    <FieldLabel>{t("attributes.start_time") || "Shift Start"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="time"
                                            {...register("shift_start_at")}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Shift End time */}
                                <Field>
                                    <FieldLabel>{t("attributes.end_time") || "Shift End"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="time"
                                            {...register("shift_end_at")}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Check In */}
                                <Field>
                                    <FieldLabel>{t("attributes.check_in") || "Check In"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="time"
                                            {...register("check_in")}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Check Out */}
                                <Field>
                                    <FieldLabel>{t("attributes.check_out") || "Check Out"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="time"
                                            {...register("check_out")}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Late Minutes */}
                                <Field>
                                    <FieldLabel>{t("attributes.late_minutes") || "Late Minutes"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="number"
                                            {...register("late_minutes", { valueAsNumber: true })}
                                            placeholder="0"
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Overtime Minutes */}
                                <Field>
                                    <FieldLabel>{t("attributes.overtime_minutes") || "Overtime Minutes"}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            type="number"
                                            {...register("overtime_minutes", { valueAsNumber: true })}
                                            placeholder="0"
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Status selection */}
                                <Field>
                                    <FieldLabel>{t("attributes.status") || "Status"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => {
                                                const selectedLabel = statusOptions.find(opt => opt.value === field.value)?.label;
                                                return (
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue>
                                                                {selectedLabel}
                                                            </SelectValue>
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
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/attendance">
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

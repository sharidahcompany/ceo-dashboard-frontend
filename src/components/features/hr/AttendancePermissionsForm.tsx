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
    getAttendancePermission,
    createAttendancePermission,
    updateAttendancePermission,
    AttendancePermissionData,
} from "@/actions/workspace/attendance-permissions.actions";
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
    FieldSet,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AttendancePermissionFormValues {
    user_id: string;
    reason: string;
    start_datetime: string;
    end_datetime: string;
    deduct_from_balance: boolean;
    status: string;
}

export default function AttendancePermissionsForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const permissionId =
        (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!permissionId);
    const [initialUser, setInitialUser] = useState<UserResource | null>(null);

    const statusOptions = [
        { value: "pending", label: t("attributes.pending") || "Pending" },
        { value: "approved", label: t("attributes.approved") || "Approved" },
        { value: "rejected", label: t("attributes.rejected") || "Rejected" },
    ];

    const {
        register,
        handleSubmit,
        setValue,
        control,
        watch,
        formState: { errors },
    } = useForm<AttendancePermissionFormValues>({
        defaultValues: {
            user_id: "",
            reason: "",
            start_datetime: "",
            end_datetime: "",
            deduct_from_balance: false,
            status: "pending",
        },
    });

    useEffect(() => {
        const loadInitialData = async () => {
            if (permissionId) {
                const res = await getAttendancePermission(permissionId);
                if (res.success) {
                    const data = res.data;

                    if (data.user) {
                        setInitialUser(data.user);
                        setValue("user_id", String(data.user.id));
                    }

                    setValue("reason", data.reason || "");
                    setValue("deduct_from_balance", data.deduct_from_balance ?? false);
                    setValue("status", data.status?.value || "pending");

                    // Format datetime to datetime-local input (YYYY-MM-DDTHH:MM)
                    const toLocalInput = (dt?: string | null) =>
                        dt ? dt.replace(" ", "T").substring(0, 16) : "";

                    setValue("start_datetime", toLocalInput(data.start_datetime));
                    setValue("end_datetime", toLocalInput(data.end_datetime));
                } else {
                    toast.error(res.error);
                }
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [permissionId, setValue]);

    const onSubmit = (values: AttendancePermissionFormValues) => {
        startTransition(async () => {
            const payload: AttendancePermissionData = {
                user_id: values.user_id,
                reason: values.reason || null,
                start_datetime: values.start_datetime
                    ? values.start_datetime.replace("T", " ") + ":00"
                    : null,
                end_datetime: values.end_datetime
                    ? values.end_datetime.replace("T", " ") + ":00"
                    : null,
                deduct_from_balance: values.deduct_from_balance,
                status: values.status,
            };

            const res = permissionId
                ? await updateAttendancePermission(permissionId, payload)
                : await createAttendancePermission(payload);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/attendance-permissions");
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

    const deductValue = watch("deduct_from_balance");

    return (
        <div className="space-y-6 w-full">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="w-full">
                    <CardHeader className="border-b">
                        <CardTitle>
                            {permissionId
                                ? t("routes.edit_attendance_permission") || "Edit Permission"
                                : t("routes.create_attendance_permission") || "Create Permission"}
                        </CardTitle>
                        <CardDescription>
                            {t("messages.hr.attendance_permission_description") ||
                                "Submit an attendance leave or late permission request"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">

                                {/* Employee */}
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

                                {/* Deduct from Balance */}
                                <Field>
                                    <FieldLabel>{t("attributes.deduct_from_balance") || "Deduct from Balance"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="deduct_from_balance"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="flex items-center gap-3 pt-1">
                                                    <Checkbox
                                                        id="deduct_from_balance"
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <Label htmlFor="deduct_from_balance" className="text-sm text-muted-foreground cursor-pointer">
                                                        {field.value
                                                            ? t("attributes.yes") || "Yes"
                                                            : t("attributes.no") || "No"}
                                                    </Label>
                                                </div>
                                            )}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Reason */}
                                <Field className="md:col-span-2">
                                    <FieldLabel>{t("attributes.reason") || "Reason"}</FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            {...register("reason")}
                                            placeholder={t("attributes.reason") || "Reason for the permission request"}
                                            rows={3}
                                        />
                                    </FieldContent>
                                </Field>

                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/attendance-permissions">
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

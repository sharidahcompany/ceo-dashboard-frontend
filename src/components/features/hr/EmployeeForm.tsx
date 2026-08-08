"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, X, Save, User as UserIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    getEmployee,
    getTenantUser,
    updateEmployee,
    UpdateEmployeeData,
    UserResource,
} from "@/actions/workspace/user.actions";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldSet,
} from "@/components/ui/field";
import EmployeeAssignmentsForm from "@/components/features/hr/EmployeeAssignmentsForm";
import EmployeePermissionsForm from "@/components/features/hr/EmployeePermissionsForm";
import EmployeeReports from "@/components/features/hr/EmployeeReports";
import { useIsOwnerOrSuperAdmin } from "@/providers/AbilityProvider";

export default function EmployeeForm() {
    const t = useTranslations();
    const router = useRouter();
    const canManagePermissions = useIsOwnerOrSuperAdmin();
    const params = useParams();
    const searchParams = useSearchParams();
    const employeeId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!employeeId);
    const [employee, setEmployee] = useState<UserResource | null>(null);
    const [tenantUser, setTenantUser] = useState<UserResource | null>(null);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<UpdateEmployeeData>({
        defaultValues: {
            first_name: "",
            last_name: "",
            username: "",
            email: "",
            phone: "",
        }
    });

    useEffect(() => {
        const loadInitialData = async () => {
            if (employeeId) {
                const [res, tenantRes] = await Promise.all([
                    getEmployee(employeeId),
                    getTenantUser(employeeId),
                ]);

                if (res.success) {
                    const data = res.data;
                    setEmployee(data);
                    setValue("first_name", data.first_name || "");
                    setValue("last_name", data.last_name || "");
                    setValue("username", data.username || "");
                    setValue("email", data.email || "");
                    setValue("phone", data.phone || "");
                } else {
                    toast.error(res.error);
                }

                if (tenantRes.success) {
                    setTenantUser(tenantRes.data);
                }

                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [employeeId, setValue]);

    const onSubmit = (values: UpdateEmployeeData) => {
        if (!employeeId) return;

        startTransition(async () => {
            const res = await updateEmployee(employeeId, values);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/employees");
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
                            {t("routes.edit_employee")}
                        </CardTitle>
                        <CardDescription>
                            {t("routes.employees")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {employee && (
                            <div className="flex items-center gap-4">
                                <Avatar size="lg">
                                    {employee.avatar && (
                                        <AvatarImage src={employee.avatar} alt={employee.username} />
                                    )}
                                    <AvatarFallback>
                                        <UserIcon className="size-5 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">
                                        {employee.first_name} {employee.last_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                                </div>
                            </div>
                        )}
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                {/* First Name Field */}
                                <Field>
                                    <FieldLabel>{t("attributes.first_name")}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("first_name", { required: "validation.required" })}
                                        />
                                        {errors.first_name && (
                                            <FieldError>{t(errors.first_name.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Last Name Field */}
                                <Field>
                                    <FieldLabel>{t("attributes.last_name")}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("last_name", { required: "validation.required" })}
                                        />
                                        {errors.last_name && (
                                            <FieldError>{t(errors.last_name.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Username Field */}
                                <Field>
                                    <FieldLabel>{t("attributes.username")}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("username", { required: "validation.required" })}
                                        />
                                        {errors.username && (
                                            <FieldError>{t(errors.username.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Phone Field */}
                                <Field>
                                    <FieldLabel>{t("attributes.phone")}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("phone", { required: "validation.required" })}
                                        />
                                        {errors.phone && (
                                            <FieldError>{t(errors.phone.message!)}</FieldError>
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
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/employees">
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

            {employeeId && (
                <>
                    <EmployeeAssignmentsForm employeeId={employeeId} initialData={tenantUser} />
                    {canManagePermissions && (
                        <EmployeePermissionsForm
                            employeeId={employeeId}
                            initialPermissions={employee?.permissions}
                        />
                    )}
                    <EmployeeReports employeeId={employeeId} />
                </>
            )}
        </div>
    );
}

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
    getTenantUser,
    updateEmployee,
    inviteUser,
    UpdateEmployeeData,
    UserResource,
} from "@/actions/workspace/user.actions";
import {
    hasDefaultContractTemplate,
    getDefaultContractTemplate,
    DocumentTemplateFieldResource,
} from "@/actions/workspace/document-templates.actions";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldSet,
} from "@/components/ui/field";
import DynamicFieldRenderer from "@/components/features/documents/DynamicFieldRenderer";
import EmployeeAssignmentsForm from "@/components/features/hr/EmployeeAssignmentsForm";
import EmployeeReports from "@/components/features/hr/EmployeeReports";
import EmployeeContracts from "@/components/features/hr/EmployeeContracts";

// Keys workspace-service's ContractAutoFiller (app/Services/Documents/ContractAutoFiller.php)
// already fills in from the User/Profile/Department/Position records when it
// generates and sends the contract on employee creation. Any job contract
// template variable outside this set (e.g. housing_allowance, which the
// auto-filler doesn't expose) has nowhere else to be filled in, so it gets
// seeded into custom_fields instead.
const PROFILE_COLUMN_KEYS = new Set([
    "employee_full_name",
    "employee_first_name",
    "employee_email",
    "employee_id_number",
    "employee_address",
    "employee_nationality",
    "employee_date_of_birth",
    "employee_gender",
    "employee_marital_status",
    "employee_hire_date",
    "employee_employment_type",
    "employee_gross_salary",
    "employee_net_salary",
    "employee_department",
    "employee_position",
]);

export default function EmployeeForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const employeeId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(true);
    const [employee, setEmployee] = useState<UserResource | null>(null);
    const [tenantUser, setTenantUser] = useState<UserResource | null>(null);
    const [customTemplateFields, setCustomTemplateFields] = useState<DocumentTemplateFieldResource[]>([]);

    const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<UpdateEmployeeData>({
        defaultValues: {
            first_name: "",
            last_name: "",
            username: "",
            email: "",
            phone: "",
            id_number: "",
            full_name: "",
            address: "",
            nationality: "",
            date_of_birth: "",
            gender: "",
            marital_status: "",
            hire_date: "",
            employment_type: "",
            gross_salary: "",
            net_salary: "",
            housing_allowance: "",
            transportation_allowance: "",
            other_allowances: "",
            emergency_contact_name: "",
            emergency_contact_phone: "",
            custom_fields: {},
        }
    });

    useEffect(() => {
        const loadInitialData = async () => {
            let existingCustomFields: Record<string, string> = {};

            if (employeeId) {
                // Both first_name/last_name/username/email/phone/avatar and the
                // profile fields below live on workspace-service's own User —
                // auth-service's /auth/users/{id} was queried for the same
                // identity fields too, but that central account isn't
                // guaranteed to exist (e.g. employees created before the
                // employee_created sync, or any sync gap), which broke this
                // form's top fields whenever it didn't. workspace-service is
                // also what updateEmployee() writes to, so it's the correct
                // single source for this view anyway.
                const tenantRes = await getTenantUser(employeeId);

                if (tenantRes.success) {
                    const data = tenantRes.data;
                    setEmployee(data);
                    setTenantUser(data);
                    setValue("first_name", data.first_name || "");
                    setValue("last_name", data.last_name || "");
                    setValue("username", data.username || "");
                    setValue("email", data.email || "");
                    setValue("phone", data.phone || "");
                    setValue("id_number", data.id_number || "");
                    setValue("full_name", data.full_name || "");
                    setValue("address", data.address || "");
                    setValue("nationality", data.nationality || "");
                    setValue("date_of_birth", data.date_of_birth || "");
                    setValue("gender", data.gender || "");
                    setValue("marital_status", data.marital_status || "");
                    setValue("hire_date", data.hire_date || "");
                    setValue("employment_type", data.employment_type || "");
                    setValue("gross_salary", data.gross_salary || "");
                    setValue("net_salary", data.net_salary || "");
                    setValue("housing_allowance", data.housing_allowance || "");
                    setValue("transportation_allowance", data.transportation_allowance || "");
                    setValue("other_allowances", data.other_allowances || "");
                    setValue("emergency_contact_name", data.emergency_contact_name || "");
                    setValue("emergency_contact_phone", data.emergency_contact_phone || "");
                    existingCustomFields = data.custom_fields || {};
                    setValue("custom_fields", existingCustomFields);
                } else {
                    toast.error(tenantRes.error);
                }
            }

            // Seed custom_fields with any job contract template variables that
            // don't map to one of the dedicated profile inputs above, so HR
            // can fill them in from this form instead of missing them. Each
            // variable is rendered as a typed input using the label/type the
            // template author configured, via DynamicFieldRenderer.
            const templateRes = await getDefaultContractTemplate();
            if (templateRes.success && templateRes.data) {
                const fields = (templateRes.data.fields ?? []).filter(
                    (field) => field.type.value !== "employee" && !PROFILE_COLUMN_KEYS.has(field.key)
                );
                setCustomTemplateFields(fields);

                const missing: Record<string, string> = {};
                fields.forEach((field) => {
                    if (field.key in existingCustomFields) return;
                    missing[field.key] = field.default_value ?? "";
                });

                if (Object.keys(missing).length > 0) {
                    setValue("custom_fields", { ...missing, ...existingCustomFields });
                }
            }

            setLoadingData(false);
        };

        loadInitialData();
    }, [employeeId, setValue]);

    const onSubmit = (values: UpdateEmployeeData) => {
        startTransition(async () => {
            if (!employeeId) {
                const templateRes = await hasDefaultContractTemplate();
                if (!templateRes.success) {
                    toast.error(templateRes.error);
                    return;
                }
                if (!templateRes.data) {
                    toast.error(t("messages.hr.no_job_contract_template"));
                    return;
                }

                // workspace-service stores the User + Profile together and
                // publishes employee_created, which auth-service consumes
                // to create the central account and send the invite email.
                const inviteRes = await inviteUser(values);

                if (!inviteRes.success) {
                    toast.error(inviteRes.error);
                    return;
                }

                // workspace-service's EmployeeService::create() generates and
                // sends the default contract itself right after this — no
                // frontend call needed, and calling one here would send a
                // second, duplicate contract.
                toast.success(inviteRes.message || t("success"));
                router.push("/hr/employees");
                return;
            }

            // department_id/position_id aren't editable on this form (that's
            // EmployeeAssignmentsForm's job below) — carry the current values
            // forward so the update doesn't silently wipe them.
            const payload: UpdateEmployeeData = {
                ...values,
                department_id: tenantUser?.department?.id ?? null,
                position_id: tenantUser?.position?.id ?? null,
            };

            const res = await updateEmployee(employeeId, payload);

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
                            {employeeId ? t("routes.edit_employee") : t("routes.create_employee")}
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

                <Card className="w-full">
                    <CardHeader className="border-b">
                        <CardTitle>{t("routes.profile_details") || "Profile Details"}</CardTitle>
                        <CardDescription>
                            {t("messages.hr.profile_details_description") || "Used to auto-fill contracts and other HR documents"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                <Field>
                                    <FieldLabel>{t("attributes.full_name")}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("full_name")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.id_number") || "ID Number"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("id_number")} />
                                    </FieldContent>
                                </Field>

                                <Field className="md:col-span-2">
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
                                    <FieldLabel>{t("routes.hire_date") || "Hire Date"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="date" {...register("hire_date")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.employment_type") || "Employment Type"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("employment_type")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.gross_salary")}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="0.01" {...register("gross_salary")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.net_salary") || "Net Salary"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="0.01" {...register("net_salary")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.housing_allowance") || "Housing Allowance"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="0.01" {...register("housing_allowance")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.transportation_allowance") || "Transportation Allowance"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="0.01" {...register("transportation_allowance")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.other_allowances") || "Other Allowances"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="0.01" {...register("other_allowances")} />
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

                                {customTemplateFields.map((field) => (
                                    <DynamicFieldRenderer
                                        key={field.key}
                                        field={field}
                                        control={control}
                                        disabled={isPending}
                                        name={`custom_fields.${field.key}`}
                                        error={
                                            (errors.custom_fields as Record<string, { message?: string }> | undefined)?.[
                                                field.key
                                            ]?.message
                                        }
                                    />
                                ))}
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
                    <EmployeeContracts employeeId={employeeId} />
                    <EmployeeReports employeeId={employeeId} />
                </>
            )}
        </div>
    );
}

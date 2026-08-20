"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, X, Save } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    getConversionPreview,
    convertToEmployee,
    ConvertToEmployeeData,
    ConversionPreview,
} from "@/actions/workspace/job-application-conversion.actions";
import { getPositions, PositionResource } from "@/actions/workspace/positions.actions";
import { getDepartments, DepartmentResource } from "@/actions/company-spirit/department.actions";
import { hasDefaultContractTemplate } from "@/actions/workspace/document-templates.actions";
import { SelectPosition } from "@/components/ui/select-position";
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
import KeyValueListEditor from "@/components/ui/key-value-list-editor";

export default function ConvertToEmployeeReview() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const applicationId = params?.id as string;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(true);
    const [preview, setPreview] = useState<ConversionPreview | null>(null);
    const [positionsList, setPositionsList] = useState<PositionResource[]>([]);
    const [departmentsList, setDepartmentsList] = useState<DepartmentResource[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    const { register, handleSubmit, setValue, watch, control, setError, formState: { errors } } = useForm<ConvertToEmployeeData>({
        defaultValues: {
            department_id: "",
            position_id: "",
            hire_date: "",
            gross_salary: "",
            full_name: "",
            id_number: "",
            address: "",
            nationality: "",
            date_of_birth: "",
            gender: "",
            marital_status: "",
            emergency_contact_name: "",
            emergency_contact_phone: "",
            custom_fields: {},
        }
    });

    const selectedPositionId = watch("position_id");
    const selectedDepartmentId = watch("department_id");

    useEffect(() => {
        const load = async () => {
            const [posRes, deptRes, previewRes] = await Promise.all([
                getPositions(),
                getDepartments(),
                getConversionPreview(applicationId),
            ]);

            if (posRes.success && posRes.data) setPositionsList(posRes.data.data);
            if (deptRes.success && deptRes.data) setDepartmentsList(deptRes.data.data);

            if (previewRes.success) {
                const data = previewRes.data;
                setPreview(data);
                setValue("department_id", data.department_id ? String(data.department_id) : "");
                setValue("position_id", data.position_id ? String(data.position_id) : "");
                // The API may return a bare date or a full ISO datetime — the
                // <input type="date"> only accepts YYYY-MM-DD, so trim it.
                setValue("hire_date", data.hire_date ? data.hire_date.slice(0, 10) : "");
                setValue("gross_salary", data.gross_salary || "");
                // Prefer what HR already entered on the application itself
                // over rebuilding it from the account's first/last name.
                setValue("full_name", data.full_name || `${data.user.first_name} ${data.user.last_name}`.trim());
                setValue("id_number", data.id_number || "");
                setValue("address", data.address || "");
                setValue("nationality", data.nationality || "");
                setValue("date_of_birth", data.date_of_birth ? data.date_of_birth.slice(0, 10) : "");
                setValue("gender", data.gender || "");
                setValue("marital_status", data.marital_status || "");
                setValue("emergency_contact_name", data.emergency_contact_name || "");
                setValue("emergency_contact_phone", data.emergency_contact_phone || "");
            } else {
                setLoadError(previewRes.error);
            }

            setLoadingData(false);
        };

        load();
    }, [applicationId, setValue]);

    const onSubmit = (values: ConvertToEmployeeData) => {
        // SelectPosition manages its own Controller without RHF `rules`, so
        // "required" isn't enforced automatically the way department_id's is.
        if (!values.position_id) {
            setError("position_id", { message: "validation.required" });
            return;
        }

        startTransition(async () => {
            const templateRes = await hasDefaultContractTemplate();
            if (!templateRes.success) {
                toast.error(templateRes.error);
                return;
            }
            if (!templateRes.data) {
                toast.error(t("messages.hr.no_job_contract_template"));
                return;
            }

            // Omit blank optional fields rather than submitting "" —
            // nullable|numeric and nullable|date backend rules reject an
            // empty string.
            const payload: ConvertToEmployeeData = { ...values };
            (Object.keys(payload) as Array<keyof ConvertToEmployeeData>).forEach((key) => {
                if (key !== "department_id" && key !== "position_id" && payload[key] === "") {
                    delete payload[key];
                }
            });

            const res = await convertToEmployee(applicationId, payload);
            if (!res.success) {
                toast.error(res.error);
                return;
            }

            // workspace-service's EmployeeService::update() detects this is
            // the candidate's first Profile and generates + sends the
            // default contract itself — no frontend call needed here.
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

    if (loadError || !preview) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-destructive">{loadError || t("errors.something_went_wrong")}</p>
                    <Link href="/hr/candidates">
                        <Button type="button" variant="outline" className="mt-4 gap-2">
                            <X className="size-4" />
                            {t("buttons.cancel")}
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    const currentSelectedPosition = positionsList.find(p => String(p.id) === selectedPositionId);
    const currentSelectedDepartment = departmentsList.find(d => String(d.id) === selectedDepartmentId);

    return (
        <div className="space-y-6 w-full">
            {/* Read-only summary of the application/offer/interview data this decision is based on */}
            <Card className="w-full">
                <CardHeader className="border-b">
                    <CardTitle>{preview.user.first_name} {preview.user.last_name}</CardTitle>
                    <CardDescription>{preview.user.email} · {preview.user.phone}</CardDescription>
                </CardHeader>
                {preview.interviews.length > 0 && (
                    <CardContent className="pt-6 space-y-4">
                        {preview.interviews.map((interview) => (
                            <div key={interview.id} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{interview.scheduled_at || "-"}</span>
                                    {interview.status && <Badge variant="outline">{interview.status}</Badge>}
                                </div>
                                {interview.feedback.map((fb, idx) => (
                                    <div key={idx} className="text-sm text-muted-foreground pl-4">
                                        {fb.interviewer}: {fb.recommendation || "-"} {fb.rating ? `(${fb.rating}/5)` : ""} {fb.notes ? `— ${fb.notes}` : ""}
                                    </div>
                                ))}
                                <Separator />
                            </div>
                        ))}
                    </CardContent>
                )}
            </Card>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="w-full">
                    <CardHeader className="border-b">
                        <CardTitle>{t("routes.convert_to_employee") || "Convert to Employee"}</CardTitle>
                        <CardDescription>{t("messages.hr.convert_to_employee_description") || "Confirm the details before creating the employee record"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                <Field>
                                    <FieldLabel>{t("attributes.department") || "Department"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="department_id"
                                            control={control}
                                            rules={{ required: "validation.required" }}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={t("actions.select_department")}>
                                                            {currentSelectedDepartment ? (currentSelectedDepartment.name_localized || currentSelectedDepartment.name?.en) : undefined}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {departmentsList.map((dept) => (
                                                            <SelectItem key={dept.id} value={String(dept.id)}>
                                                                {dept.name_localized || dept.name?.en}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.department_id && (
                                            <FieldError>{t(errors.department_id.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("routes.positions")}</FieldLabel>
                                    <FieldContent>
                                        <SelectPosition<ConvertToEmployeeData>
                                            control={control}
                                            name="position_id"
                                            initialPosition={currentSelectedPosition}
                                        />
                                        {errors.position_id && (
                                            <FieldError>{t(errors.position_id.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.full_name") || "Full Name"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("full_name")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("routes.hire_date") || "Hire Date"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="date" {...register("hire_date")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.gross_salary") || "Gross Salary"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="0.01" {...register("gross_salary")} />
                                    </FieldContent>
                                </Field>

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

                                <Field className="md:col-span-2">
                                    <FieldLabel>{t("attributes.custom_fields") || "Custom Fields"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="custom_fields"
                                            control={control}
                                            render={({ field }) => (
                                                <KeyValueListEditor
                                                    value={field.value}
                                                    disabled={isPending}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
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
                        {t("routes.convert_to_employee") || "Convert to Employee"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

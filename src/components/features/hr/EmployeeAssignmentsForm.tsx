"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldContent, FieldSet } from "@/components/ui/field";
import { MultiSelectBranch } from "@/components/ui/multi-select-branch";
import { SelectDepartment } from "@/components/ui/select-department";
import { SelectPosition } from "@/components/ui/select-position";
import { UserResource, updateUserAssignments } from "@/actions/workspace/user.actions";
import type { DepartmentResource } from "@/actions/company-spirit/department.actions";
import type { PositionResource } from "@/actions/workspace/positions.actions";

/**
 * The user resource carries the department/position as a bare {id, name}, so
 * shape it into the option the selects expect — without it the currently
 * assigned value renders blank until its page happens to load.
 */
function toOption<T>(entity?: { id: number; name: Record<string, string> | string } | null): T | null {
    if (!entity) return null;
    const name = typeof entity.name === "string" ? entity.name : entity.name?.ar || entity.name?.en || "";
    return { id: entity.id, name_localized: name, name: { ar: name, en: name } } as T;
}

interface EmployeeAssignmentsFormValues {
    branch_ids: string[];
    department_id: string;
    position_id: string;
}

interface EmployeeAssignmentsFormProps {
    employeeId: string;
    initialData?: UserResource | null;
}

export default function EmployeeAssignmentsForm({ employeeId, initialData }: EmployeeAssignmentsFormProps) {
    const t = useTranslations();
    const [isPending, startTransition] = useTransition();

    const { control, handleSubmit } = useForm<EmployeeAssignmentsFormValues>({
        defaultValues: {
            branch_ids: (initialData?.branches ?? []).map((b) => String(b.id)),
            department_id: initialData?.department?.id ? String(initialData.department.id) : "",
            position_id: initialData?.position?.id ? String(initialData.position.id) : "",
        },
    });

    const onSubmit = (values: EmployeeAssignmentsFormValues) => {
        startTransition(async () => {
            const res = await updateUserAssignments(employeeId, {
                branch_ids: values.branch_ids,
                department_id: values.department_id || null,
                position_id: values.position_id || null,
            });

            if (!res.success) {
                toast.error(res.error);
                return;
            }

            toast.success(res.message || t("success"));
        });
    };

    return (
        <Card className="w-full">
            <CardHeader className="border-b">
                <CardTitle>{t("attributes.assignments")}</CardTitle>
                <CardDescription>{t("messages.employees.assignments_description")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <FieldSet>
                        <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                            <Field>
                                <FieldLabel>{t("attributes.branches")}</FieldLabel>
                                <FieldContent>
                                    <MultiSelectBranch
                                        control={control}
                                        name="branch_ids"
                                        initialBranches={initialData?.branches ?? []}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>{t("attributes.departments")}</FieldLabel>
                                <FieldContent>
                                    <SelectDepartment
                                        control={control}
                                        name="department_id"
                                        initialDepartment={toOption<DepartmentResource>(initialData?.department)}
                                    />
                                </FieldContent>
                            </Field>

                            <Field className="md:col-span-2">
                                <FieldLabel>{t("attributes.positions")}</FieldLabel>
                                <FieldContent>
                                    <SelectPosition
                                        control={control}
                                        name="position_id"
                                        initialPosition={toOption<PositionResource>(initialData?.position)}
                                    />
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </FieldSet>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending} className="gap-2">
                            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            {t("buttons.save")}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

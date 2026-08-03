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
import { MultiSelectDepartment } from "@/components/ui/multi-select-department";
import { MultiSelectPosition } from "@/components/ui/multi-select-position";
import {
    UserResource,
    assignUserBranches,
    assignUserDepartments,
    assignUserPositions,
} from "@/actions/workspace/user.actions";

interface EmployeeAssignmentsFormValues {
    branch_ids: string[];
    department_ids: string[];
    position_ids: string[];
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
            department_ids: (initialData?.departments ?? []).map((d) => String(d.id)),
            position_ids: (initialData?.positions ?? []).map((p) => String(p.id)),
        },
    });

    const onSubmit = (values: EmployeeAssignmentsFormValues) => {
        startTransition(async () => {
            const [branchesRes, departmentsRes, positionsRes] = await Promise.all([
                assignUserBranches(employeeId, { branch_ids: values.branch_ids }),
                assignUserDepartments(employeeId, { department_ids: values.department_ids }),
                assignUserPositions(employeeId, { position_ids: values.position_ids }),
            ]);

            const failed = [branchesRes, departmentsRes, positionsRes].find((r) => !r.success);
            if (failed && !failed.success) {
                toast.error(failed.error);
                return;
            }

            toast.success(t("success"));
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
                                    <MultiSelectDepartment
                                        control={control}
                                        name="department_ids"
                                        initialDepartments={initialData?.departments ?? []}
                                    />
                                </FieldContent>
                            </Field>

                            <Field className="md:col-span-2">
                                <FieldLabel>{t("attributes.positions")}</FieldLabel>
                                <FieldContent>
                                    <MultiSelectPosition
                                        control={control}
                                        name="position_ids"
                                        initialPositions={initialData?.positions ?? []}
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

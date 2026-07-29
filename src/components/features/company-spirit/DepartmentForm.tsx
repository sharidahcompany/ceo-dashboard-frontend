"use client"

import { createDepartment, DepartmentResource, updateDepartment } from "@/actions/company-spirit/department.actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLegend, FieldSeparator, FieldSet, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectBranch } from "@/components/ui/select-branch";
import { SelectDepartment } from "@/components/ui/select-department";
import { SelectUser } from "@/components/ui/select-user";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export const departmentSchema = z.object({
    name: z.object({
        en: z
            .string()
            .min(1, { message: "validation.required" })
            .max(255, { message: "validation.max" }),
        ar: z
            .string()
            .min(1, { message: "validation.required" })
            .max(255, { message: "validation.max" }),
    }),
    parent_id: z.string().or(z.number()).optional().nullable(),
    branch_id: z.string().or(z.number()).optional().nullable(),
    manager_id: z.string().or(z.number()).optional().nullable(),
});

export type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormResource {
    initialData?: DepartmentResource;
    onSuccess: () => void;
}

export default function DepartmentForm({ initialData, onSuccess }: DepartmentFormResource) {
    const t = useTranslations();

    const parentId = initialData?.parent_id ?? initialData?.parent?.id;
    const branchId = initialData?.branch_id ?? initialData?.branch?.id;
    const managerId = initialData?.manager_id ?? initialData?.manager?.id;

    const {
        formState: { errors },
        register,
        handleSubmit,
        control,
    } = useForm<DepartmentFormData>({
        resolver: zodResolver(departmentSchema),
        defaultValues: {
            name: {
                en: initialData?.name?.en ?? "",
                ar: initialData?.name?.ar ?? "",
            },
            parent_id: parentId ? String(parentId) : undefined,
            branch_id: branchId ? String(branchId) : undefined,
            manager_id: managerId ? String(managerId) : undefined,
        },
    });

    const [isPending, startTransition] = useTransition();

    const handleSave = (data: DepartmentFormData) => {
        startTransition(async () => {
            if (initialData?.id) {
                const result = await updateDepartment(initialData.id, data);
                if (!result.success) {
                    toast.error(result.error);
                    return;
                }
                toast.success(result.data.message);
                onSuccess();
            } else {
                const result = await createDepartment(data);
                if (!result.success) {
                    toast.error(result.error);
                    return;
                }
                toast.success(result.data.message);
                onSuccess();
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(handleSave)}>
            <FieldSet>
                <FieldLegend className="text-muted-foreground mb-5">
                    <FieldTitle>{t("attributes.basic_info")}</FieldTitle>
                </FieldLegend>

                <FieldGroup>
                    <Field>
                        <Label>{t("attributes.name_ar")}</Label>
                        <Input
                            {...register("name.ar")}
                            placeholder={t("attributes.name_ar")}
                        />
                        {errors?.name?.ar && (
                            <FieldError>{t(errors.name.ar.message!)}</FieldError>
                        )}
                    </Field>

                    <Field>
                        <Label>{t("attributes.name_en")}</Label>
                        <Input
                            {...register("name.en")}
                            placeholder={t("attributes.name_en")}
                        />
                        {errors?.name?.en && (
                            <FieldError>{t(errors.name.en.message!)}</FieldError>
                        )}
                    </Field>

                    <Field>
                        <Label>{t("attributes.parent_department")}</Label>
                        {/* تمرير initialData الخاص بالقسم الأب لتسهيل العرض */}
                        <SelectDepartment
                            control={control}
                            name="parent_id"
                            initialDepartment={initialData?.parent}
                        />
                        {errors?.parent_id && (
                            <FieldError>{t(errors.parent_id.message!)}</FieldError>
                        )}
                    </Field>

                    <Field>
                        <Label>{t("attributes.branch")}</Label>
                        {/* تمرير initialData الخاص بالفرع */}
                        <SelectBranch
                            control={control}
                            name="branch_id"
                            initialBranch={initialData?.branch}
                        />
                        {errors?.branch_id && (
                            <FieldError>{t(errors.branch_id.message!)}</FieldError>
                        )}
                    </Field>
                </FieldGroup>

                <FieldSeparator />

                <FieldLegend className="text-muted-foreground">
                    {t("attributes.branch_manager")}
                </FieldLegend>

                <Field>
                    {/* تمرير initialUser الخاص بالمدير لضمان ظهوره فوراً في Edit */}
                    <SelectUser
                        control={control}
                        name="manager_id"
                        initialUser={initialData?.manager}
                    />
                    {errors?.manager_id && (
                        <FieldError>{t(errors.manager_id.message!)}</FieldError>
                    )}
                </Field>

                <FieldGroup className="mt-4">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <Spinner /> : <Building />}
                        {initialData
                            ? t("messages.org_structure.update_department")
                            : t("messages.org_structure.add_new_department")}
                    </Button>
                </FieldGroup>
            </FieldSet>
        </form>
    );
}
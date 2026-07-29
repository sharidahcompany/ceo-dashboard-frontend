"use client"
import { BranchResource, createBranch, updateBranch } from "@/actions/company-spirit/branch.actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLegend, FieldSeparator, FieldSet, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const branchSchema = z.object({
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
    code: z
        .string()
        .max(50, { message: "validation.max" })
        .optional(),
    building_number: z
        .string()
        .max(50, { message: "validation.max" })
        .optional(),
    street: z
        .string()
        .max(255, { message: "validation.max" })
        .optional(),
    city: z
        .string()
        .max(255, { message: "validation.max" })
        .optional(),
    postal_code: z
        .string()
        .max(20, { message: "validation.max" })
        .optional(),
    country: z
        .string()
        .max(255, { message: "validation.max" })
        .optional(),
    latitude: z
        .string().or(z.number())
        .optional(),
    longitude: z
        .string().or(z.number())
        .optional(),
    radius: z
        .string().or(z.number())
        .optional(),
    manager_id: z.string().optional(),
});

export type BranchFormData = z.infer<typeof branchSchema>;

interface BranchFormResource {
    initialData?: BranchResource;
    onSuccess: () => void;
}

export default function BranchForm({ initialData, onSuccess }: BranchFormResource) {
    const t = useTranslations();
    const {
        formState: { errors },
        register,
        handleSubmit,
        control,
    } = useForm<BranchFormData>({
        resolver: zodResolver(branchSchema),
        defaultValues: {
            name: {
                en: initialData?.name?.en ?? "",
                ar: initialData?.name?.ar ?? "",
            },
            code: initialData?.code ?? "",
            building_number: initialData?.building_number ?? "",
            street: initialData?.street ?? "",
            city: initialData?.city ?? "",
            postal_code: initialData?.postal_code ?? "",
            country: initialData?.country ?? "",
            latitude: initialData?.latitude ?? undefined,
            longitude: initialData?.longitude ?? undefined,
            radius: initialData?.radius ?? undefined,
            manager_id: initialData?.manager?.id?.toString() ?? "",
        },
    });

    const [isPending, startTransition] = useTransition();

    const handleSave = (data: BranchFormData) => {
        startTransition(async () => {

            if (initialData?.id) {
                const result = await updateBranch(initialData.id, data);
                if (!result.success) {
                    toast.error(result.error);
                    return;
                }
                toast.success(result.data.message);
                onSuccess();
            } else {
                const result = await createBranch(data);
                if (!result.success) {
                    toast.error(result.error);
                    return;
                }
                toast.success(result.data.message);
                onSuccess();
            }

        })
    }

    return (
        <form onSubmit={handleSubmit(handleSave)}>
            <FieldSet>
                <FieldLegend className="text-muted-foreground mb-5">
                    <FieldTitle>
                        {t("attributes.basic_info")}</FieldTitle>
                </FieldLegend>
                <FieldGroup>
                    <Field>
                        <Label>
                            {t("attributes.name_ar")}
                        </Label>
                        <Input
                            {...register("name.ar")}
                            placeholder={t("attributes.name_ar")} />
                        {errors?.name?.ar && (<FieldError>{t(errors.name?.ar?.message!)}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>
                            {t("attributes.name_en")}
                        </Label>
                        <Input
                            {...register("name.en")}
                            placeholder={t("attributes.name_en")} />
                        {errors?.name?.en && (<FieldError>{t(errors.name?.en?.message!)}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>
                            {t("attributes.branch_code")}
                        </Label>
                        <Input
                            {...register("code")}
                            placeholder={t("attributes.branch_code")} />
                        {errors?.code && (<FieldError>{t(errors.code?.message!)}</FieldError>
                        )}
                    </Field>
                </FieldGroup>

                <FieldSeparator />

                <FieldLegend className="text-muted-foreground">
                    {t("attributes.address")}
                </FieldLegend>
                <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field>
                        <Label>
                            {t("attributes.building_number")}
                        </Label>
                        <Input
                            {...register("building_number")}
                            placeholder={t("attributes.building_number")} />
                        {errors?.building_number && (<FieldError>{t(errors.building_number?.message!)}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>
                            {t("attributes.street")}
                        </Label>
                        <Input
                            {...register("street")}
                            placeholder={t("attributes.street")} />
                        {errors?.street && (<FieldError>{t(errors.street?.message!)}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>
                            {t("attributes.city")}
                        </Label>
                        <Input
                            {...register("city")}
                            placeholder={t("attributes.city")} />
                        {errors?.city && (<FieldError>{t(errors.city?.message!)}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>
                            {t("attributes.postal_code")}
                        </Label>
                        <Input
                            {...register("postal_code")}
                            placeholder={t("attributes.postal_code")} />
                        {errors?.postal_code && (<FieldError>{t(errors.postal_code?.message!)}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>
                            {t("attributes.country")}
                        </Label>
                        <Input
                            {...register("country")}
                            placeholder={t("attributes.country")} />
                        {errors?.country && (<FieldError>{t(errors.country?.message!)}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>
                            {t("attributes.latitude")}
                        </Label>
                        <Input
                            {...register("latitude")}
                            placeholder={t("attributes.latitude")} />
                        {errors?.latitude && (<FieldError>{t(errors.latitude?.message!)}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>
                            {t("attributes.longitude")}
                        </Label>
                        <Input
                            {...register("longitude")}
                            placeholder={t("attributes.longitude")} />
                        {errors?.longitude && (<FieldError>{t(errors.longitude?.message!)}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>
                            {t("attributes.radius")}
                        </Label>
                        <Input
                            {...register("radius")}
                            placeholder={t("attributes.radius")} />
                        {errors?.radius && (<FieldError>{t(errors.radius?.message!)}</FieldError>
                        )}
                    </Field>
                </FieldGroup>

                <FieldLegend className="text-muted-foreground">
                    {t("attributes.branch_manager")}
                </FieldLegend>

                <SelectUser
                    control={control}
                    name="manager_id"
                    initialUser={initialData?.manager}

                />
                {errors?.manager_id && (<FieldError>{t(errors.manager_id?.message!)}</FieldError>
                )}

                <FieldGroup>
                    <Button type="submit" disabled={isPending}>
                        {isPending ?
                            (<Spinner />) : (<Building />)
                        }
                        {initialData ? t("messages.org_structure.update_branch") : t("messages.org_structure.add_new_branch")}
                    </Button>
                </FieldGroup>
            </FieldSet>
        </form>
    )

}
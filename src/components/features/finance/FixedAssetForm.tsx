"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, NumericInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldSet,
} from "@/components/ui/field";
import { SelectEntity, EntityOption } from "@/components/ui/select-entity";

import {
    getFixedAsset,
    createFixedAsset,
    updateFixedAsset,
    FixedAssetFormData,
} from "@/actions/finance/fixed-asset.actions";
import { getAccounts } from "@/actions/finance/account.actions";
import { getCostCenters } from "@/actions/finance/cost-center.actions";
import { getProjects } from "@/actions/projects/projects.actions";

const fixedAssetSchema = z.object({
    asset_number: z.string().min(1, { message: "validation.required" }),
    name: z.string().min(1, { message: "validation.required" }),
    purchase_date: z.string().min(1, { message: "validation.required" }),
    purchase_cost: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null, {
        message: "validation.required",
    }),
    salvage_value: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null, {
        message: "validation.required",
    }),
    life_in_months: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null, {
        message: "validation.required",
    }),
    depreciation_start_month: z.string().min(1, { message: "validation.required" }),
    fixed_asset_account_id: z.union([z.string(), z.number()]).refine((v) => !!v, {
        message: "validation.required",
    }),
    depreciation_account_id: z.union([z.string(), z.number()]).refine((v) => !!v, {
        message: "validation.required",
    }),
    accumulated_depreciation_account_id: z.union([z.string(), z.number()]).refine((v) => !!v, {
        message: "validation.required",
    }),
    notes: z.string().optional(),
    cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
    project_id: z.union([z.string(), z.number()]).optional().nullable(),
});

type FixedAssetFormValues = z.infer<typeof fixedAssetSchema>;

export default function FixedAssetForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const assetId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!assetId);

    const [accounts, setAccounts] = useState<EntityOption[]>([]);
    const [costCenters, setCostCenters] = useState<EntityOption[]>([]);
    const [projects, setProjects] = useState<EntityOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<FixedAssetFormValues>({
        resolver: zodResolver(fixedAssetSchema),
        defaultValues: {
            asset_number: "",
            name: "",
            purchase_date: "",
            purchase_cost: "",
            salvage_value: "",
            life_in_months: "",
            depreciation_start_month: "",
            fixed_asset_account_id: "",
            depreciation_account_id: "",
            accumulated_depreciation_account_id: "",
            notes: "",
            cost_center_id: null,
            project_id: null,
        },
    });

    useEffect(() => {
        const loadOptions = async () => {
            setOptionsLoading(true);
            const [accountsRes, costCentersRes, projectsRes] = await Promise.all([
                getAccounts(),
                getCostCenters({ limit: 1000 }),
                getProjects(),
            ]);

            if (accountsRes.success) {
                setAccounts(
                    accountsRes.data.map((a) => ({
                        id: a.id,
                        label: `${a.account_code} - ${a.name_localized || a.name?.en}`,
                    }))
                );
            }
            if (costCentersRes.success) {
                setCostCenters(costCentersRes.data.data.map((cc) => ({ id: cc.id, label: cc.name_localized || cc.name?.en || cc.name?.ar })));
            }
            if (projectsRes.success) {
                setProjects(projectsRes.data.map((p) => ({ id: p.id, label: p.name })));
            }
            setOptionsLoading(false);
        };
        loadOptions();
    }, []);

    useEffect(() => {
        if (!assetId) return;
        const loadAsset = async () => {
            const res = await getFixedAsset(assetId);
            if (res.success) {
                const a = res.data;
                setValue("asset_number", a.asset_number || "");
                setValue("name", a.name || "");
                setValue("purchase_date", a.purchase_date?.slice(0, 10) || "");
                setValue("purchase_cost", a.purchase_cost);
                setValue("salvage_value", a.salvage_value);
                setValue("life_in_months", a.life_in_months);
                setValue("depreciation_start_month", a.depreciation_start_month?.slice(0, 7) || "");
                setValue("fixed_asset_account_id", a.fixed_asset_account?.id ? String(a.fixed_asset_account.id) : "");
                setValue("depreciation_account_id", a.depreciation_account?.id ? String(a.depreciation_account.id) : "");
                setValue("accumulated_depreciation_account_id", a.accumulated_depreciation_account?.id ? String(a.accumulated_depreciation_account.id) : "");
                setValue("notes", a.notes || "");
                setValue("cost_center_id", a.cost_center_id ? String(a.cost_center_id) : null);
                setValue("project_id", a.project_id ? String(a.project_id) : null);
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadAsset();
    }, [assetId, setValue]);

    const onSubmit = (values: FixedAssetFormValues) => {
        startTransition(async () => {
            const payload: FixedAssetFormData = {
                ...values,
                cost_center_id: values.cost_center_id || null,
                project_id: values.project_id || null,
            };

            const res = assetId
                ? await updateFixedAsset(assetId, payload)
                : await createFixedAsset(payload);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.back();
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
                            {assetId ? t("attributes.edit_fixed_asset") || "Edit Fixed Asset" : t("attributes.create_fixed_asset") || "Create Fixed Asset"}
                        </CardTitle>
                        <CardDescription>{t("routes.finance") || "Finance"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                <Field>
                                    <FieldLabel>{t("attributes.asset_number") || "Asset Number"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("asset_number")} placeholder={t("attributes.asset_number") || "Asset Number"} />
                                        {errors.asset_number && <FieldError>{t(errors.asset_number.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.name") || "Name"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("name")} placeholder={t("attributes.name") || "Name"} />
                                        {errors.name && <FieldError>{t(errors.name.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.purchase_date") || "Purchase Date"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="date" {...register("purchase_date")} />
                                        {errors.purchase_date && <FieldError>{t(errors.purchase_date.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.purchase_cost") || "Purchase Cost"}</FieldLabel>
                                    <FieldContent>
                                        <NumericInput {...register("purchase_cost")} />
                                        {errors.purchase_cost && <FieldError>{t(errors.purchase_cost.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.salvage_value") || "Salvage Value"}</FieldLabel>
                                    <FieldContent>
                                        <NumericInput {...register("salvage_value")} />
                                        {errors.salvage_value && <FieldError>{t(errors.salvage_value.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.life_in_months") || "Life (Months)"}</FieldLabel>
                                    <FieldContent>
                                        <NumericInput {...register("life_in_months")} />
                                        {errors.life_in_months && <FieldError>{t(errors.life_in_months.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.depreciation_start_month") || "Depreciation Start Month"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="month" {...register("depreciation_start_month")} />
                                        {errors.depreciation_start_month && <FieldError>{t(errors.depreciation_start_month.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.fixed_asset_account") || "Fixed Asset Account"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="fixed_asset_account_id"
                                            options={accounts}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_account") || "Select account"}
                                        />
                                        {errors.fixed_asset_account_id && <FieldError>{t(errors.fixed_asset_account_id.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.depreciation_account") || "Depreciation Account"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="depreciation_account_id"
                                            options={accounts}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_account") || "Select account"}
                                        />
                                        {errors.depreciation_account_id && <FieldError>{t(errors.depreciation_account_id.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.accumulated_depreciation_account") || "Accumulated Depreciation Account"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="accumulated_depreciation_account_id"
                                            options={accounts}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_account") || "Select account"}
                                        />
                                        {errors.accumulated_depreciation_account_id && <FieldError>{t(errors.accumulated_depreciation_account_id.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.cost_center") || "Cost Center"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="cost_center_id"
                                            options={costCenters}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_cost_center") || "Select cost center"}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.project") || "Project"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="project_id"
                                            options={projects}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_project") || "Select project"}
                                        />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>

                            <Field>
                                <FieldLabel>{t("attributes.notes") || "Notes"}</FieldLabel>
                                <FieldContent>
                                    <Textarea {...register("notes")} rows={3} />
                                </FieldContent>
                            </Field>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" disabled={isPending} className="gap-2" onClick={() => router.back()}>
                        <X className="size-4" />
                        {t("buttons.cancel")}
                    </Button>
                    <Button type="submit" disabled={isPending} className="gap-2">
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        {t("buttons.save")}
                    </Button>
                </div>
            </form>
        </div>
    );
}

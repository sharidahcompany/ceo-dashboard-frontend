"use client";

import React, { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, NumericInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CurrencyField } from "@/components/ui/currency";
import { toast } from "sonner";

import {
    PlanResource,
    FeatureResource,
    createPlan,
    updatePlan,
    PlanFormData
} from "@/actions/website/plans.actions";

interface PlanFormProps {
    initialData?: PlanResource;
    featuresList: FeatureResource[];
    currencies?: {
        code: string;
        label: string;
        symbol: string;
    }[];
}

const planSchema = z.object({
    name: z.string().min(1, "validation.required"),
    slug: z.string().min(1, "validation.required").regex(/^[a-z0-9-]+$/, "validation.invalid_slug"),
    description: z.string().nullable().optional(),
    is_free: z.boolean(),
    is_active: z.boolean(),
    currency: z.string().min(1, "validation.required"),
    price: z.coerce.number().min(0),
    billing_period: z.coerce.number().min(1),
    billing_interval: z.enum(["day", "week", "month", "year"]),
    trial_days: z.coerce.number().min(0),
    grace_days: z.coerce.number().min(0),
    sort_order: z.coerce.number().min(0),
    // Associated features mapping
    featuresMap: z.record(
        z.string(),
        z.object({
            enabled: z.boolean(),
            value: z.coerce.number().min(0),
            unit_price: z.string(),
            reset_period: z.coerce.number().min(1),
            reset_interval: z.enum(["day", "week", "month", "year"]),
        })
    ),
});

type PlanFormInput = z.infer<typeof planSchema>;

export default function PlanForm({ initialData, featuresList, currencies }: PlanFormProps) {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const currentLocale = (params?.locale as string) || "en";
    const [isPending, startTransition] = useTransition();

    // Map initial features if any
    const initialFeaturesMap: Record<string, any> = {};
    featuresList.forEach((feat) => {
        const associated = initialData?.features?.find((f) => f.id === feat.id);
        initialFeaturesMap[feat.id.toString()] = {
            enabled: !!associated,
            value: associated ? associated.value : (feat.type === "toggle" ? 1 : 0),
            unit_price: associated ? associated.unit_price : "0.00000000",
            reset_period: associated ? associated.reset_period : 1,
            reset_interval: associated ? associated.reset_interval : "month",
        };
    });

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(planSchema),
        defaultValues: {
            name: initialData?.name || "",
            slug: initialData?.slug || "",
            description: initialData?.description || "",
            is_free: initialData?.is_free ?? false,
            is_active: initialData?.is_active ?? true,
            currency: typeof initialData?.currency === "object" && initialData?.currency ? (initialData.currency as any).code : (initialData?.currency || "SAR"),
            price: initialData?.price || 0,
            billing_period: initialData?.billing_period || 1,
            billing_interval: initialData?.billing_interval || "month",
            trial_days: initialData?.trial_days || 0,
            grace_days: initialData?.grace_days || 0,
            sort_order: initialData?.sort_order || 0,
            featuresMap: initialFeaturesMap,
        },
    });

    const isFree = watch("is_free");
    const featuresMap = watch("featuresMap");

    const onSubmit = (data: any) => {
        startTransition(async () => {
            // Format selected features for API payload
            const selectedFeatures: any[] = [];
            Object.entries(data.featuresMap || {}).forEach(([featureId, config]: [string, any]) => {
                if (config.enabled) {
                    selectedFeatures.push({
                        id: Number(featureId),
                        value: config.value,
                        unit_price: config.unit_price,
                        reset_period: config.reset_period,
                        reset_interval: config.reset_interval,
                    });
                }
            });

            const payload: PlanFormData = {
                name: data.name,
                slug: data.slug,
                description: data.description || null,
                is_free: data.is_free,
                is_active: data.is_active,
                currency: data.currency,
                price: data.is_free ? 0 : data.price,
                billing_period: data.billing_period,
                billing_interval: data.billing_interval,
                trial_days: data.trial_days,
                grace_days: data.grace_days,
                sort_order: data.sort_order,
                features: selectedFeatures,
            };

            let response;
            if (initialData?.id) {
                response = await updatePlan(initialData.id, payload);
            } else {
                response = await createPlan(payload);
            }

            if (response.success) {
                toast.success(t("messages.success", { defaultValue: "Saved successfully!" }));
                router.push(`/${currentLocale}/website/plans`);
            } else {
                toast.error(response.error || t("errors.something_went_wrong"));
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Primary Config Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("plans.fields.name", { defaultValue: "Plan Information" })}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field>
                                    <FieldLabel>
                                        {t("plans.fields.name", { defaultValue: "Plan Name" })}
                                    </FieldLabel>
                                    <Input
                                        {...register("name")}
                                        placeholder={t("plans.placeholders.name", { defaultValue: "e.g. Premium Plan" })}
                                       
                                    />
                                    {errors.name && <FieldError>{t(errors.name.message as any)}</FieldError>}
                                </Field>

                                <Field>
                                    <FieldLabel>
                                        {t("plans.fields.slug", { defaultValue: "Slug" })}
                                    </FieldLabel>
                                    <Input
                                        {...register("slug")}
                                        placeholder={t("plans.placeholders.slug", { defaultValue: "e.g. premium-plan" })}
                                        className="text-left font-mono"
                                        dir="ltr"
                                    />
                                    {errors.slug && <FieldError>{t(errors.slug.message as any)}</FieldError>}
                                </Field>
                            </div>

                            <Field>
                                <FieldLabel>
                                    {t("plans.fields.description", { defaultValue: "Plan Description" })}
                                </FieldLabel>
                                <textarea
                                    {...register("description")}
                                    rows={4}
                                    className="w-full flex min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder={t("plans.placeholders.description", { defaultValue: "Enter details describing the subscription benefits..." })}
                                />
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                <div className="md:col-span-1 flex flex-col gap-4">
                                    <Controller
                                        name="is_free"
                                        control={control}
                                        render={({ field }) => (
                                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                                                <span>{t("plans.fields.is_free", { defaultValue: "Is Free Plan" })}</span>
                                            </label>
                                        )}
                                    />

                                    <Controller
                                        name="is_active"
                                        control={control}
                                        render={({ field }) => (
                                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                                                <span>{t("plans.fields.is_active", { defaultValue: "Is Active" })}</span>
                                            </label>
                                        )}
                                    />
                                </div>

                                {!isFree && (
                                    <>
                                        <Field>
                                            <FieldLabel>
                                                {t("plans.fields.price", { defaultValue: "Price" })}
                                            </FieldLabel>
                                            <NumericInput
                                                {...register("price")}

                                            />
                                            {errors.price && <FieldError>{t(errors.price.message as any)}</FieldError>}
                                        </Field>

                                        <Field>
                                            <CurrencyField
                                                control={control}
                                                name="currency"
                                                errors={errors}
                                                currencies={currencies}
                                            />
                                        </Field>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Features checklist card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("plans.features_section", { defaultValue: "Plan Features Configuration" })}</CardTitle>
                            <CardDescription>
                                {t("plans.features_help", { defaultValue: "Define the limits or toggles for each feature definition attached to this plan." })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {featuresList.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground text-sm">
                                    {t("features.no_features", { defaultValue: "No feature definitions found" })}
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {featuresList.map((feat) => {
                                        const key = feat.id.toString();
                                        const isEnabled = featuresMap?.[key]?.enabled;

                                        return (
                                            <div key={feat.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <Controller
                                                            name={`featuresMap.${key}.enabled`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Checkbox
                                                                    checked={!!field.value}
                                                                    onCheckedChange={(val) => {
                                                                        field.onChange(val);
                                                                        // Automatically preset default values if enabled
                                                                        if (val) {
                                                                            setValue(`featuresMap.${key}.value`, feat.type === "toggle" ? 1 : 10);
                                                                        }
                                                                    }}
                                                                    className="mt-1"
                                                                />
                                                            )}
                                                        />
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">{feat.name}</p>
                                                            <p className="text-xs text-muted-foreground">{feat.description || feat.slug}</p>
                                                            <Badge className="mt-1 bg-muted text-muted-foreground hover:bg-muted font-normal text-[10px] px-1.5 py-0">
                                                                {t(`features.types.${feat.type}`, { defaultValue: feat.type })}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* If enabled, show configuration limits */}
                                                {isEnabled && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pl-7 pr-4 py-2 bg-muted/30 rounded-lg border">
                                                        {feat.type === "toggle" ? (
                                                            <Field>
                                                                <Controller
                                                                    control={control}
                                                                    name={`featuresMap.${key}.value`}
                                                                    render={({ field }) => (
                                                                        <Select
                                                                            value={field.value?.toString()}
                                                                            onValueChange={(val) => field.onChange(Number(val))}
                                                                        >
                                                                            <SelectTrigger className="w-full h-8">
                                                                                <SelectValue>
                                                                                    {field.value === 1 ? t("status.active", { defaultValue: "Active" }) : t("status.draft", { defaultValue: "Inactive" })}
                                                                                </SelectValue>
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="1">{t("status.active", { defaultValue: "Active" })}</SelectItem>
                                                                                <SelectItem value="0">{t("status.draft", { defaultValue: "Inactive" })}</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    )}
                                                                />
                                                            </Field>
                                                        ) : (
                                                            <Field>
                                                                <FieldLabel>
                                                                    {t("features.fields.value", { defaultValue: "Limit" })}
                                                                </FieldLabel>
                                                                <NumericInput
                                                                    {...register(`featuresMap.${key}.value`)}
                                                                />
                                                            </Field>
                                                        )}

                                                        <Field>
                                                            <FieldLabel>
                                                                {t("features.fields.unit_price", { defaultValue: "Overuse Unit Price" })}
                                                            </FieldLabel>
                                                            <Input
                                                                type="text"
                                                                {...register(`featuresMap.${key}.unit_price`)}
                                                                placeholder={t("plans.placeholders.price", { defaultValue: "0.000000" })}
                                                               
                                                            />
                                                        </Field>

                                                        <Field>
                                                            <FieldLabel>
                                                                {t("features.fields.reset_period", { defaultValue: "Reset Cycle" })}
                                                            </FieldLabel>
                                                            <NumericInput
                                                                allowDecimal={false}
                                                                {...register(`featuresMap.${key}.reset_period`)}
                                                            />
                                                        </Field>

                                                        <Field>
                                                            <FieldLabel>
                                                                {t("features.fields.reset_interval", { defaultValue: "Reset Interval" })}
                                                            </FieldLabel>
                                                            <Controller
                                                                control={control}
                                                                name={`featuresMap.${key}.reset_interval`}
                                                                render={({ field }) => (
                                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                                        <SelectTrigger className="w-full h-8">
                                                                            <SelectValue>
                                                                                {field.value ? t(`plans.interval.${field.value}`) : null}
                                                                            </SelectValue>
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="day">{t("plans.interval.day", { defaultValue: "Daily" })}</SelectItem>
                                                                            <SelectItem value="week">{t("plans.interval.week", { defaultValue: "Weekly" })}</SelectItem>
                                                                            <SelectItem value="month">{t("plans.interval.month", { defaultValue: "Monthly" })}</SelectItem>
                                                                            <SelectItem value="year">{t("plans.interval.year", { defaultValue: "Yearly" })}</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            />
                                                        </Field>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Configuration Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("plans.settings_title", { defaultValue: "Billing Period" })}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Field>
                                <FieldLabel>
                                    {t("plans.fields.billing_period", { defaultValue: "Period Duration" })}
                                </FieldLabel>
                                <NumericInput
                                    allowDecimal={false}
                                    {...register("billing_period")}

                                />
                                {errors.billing_period && <FieldError>{t(errors.billing_period.message as any)}</FieldError>}
                            </Field>

                            <Field>
                                <FieldLabel>
                                    {t("plans.fields.billing_interval", { defaultValue: "Billing Cycle" })}
                                </FieldLabel>
                                <Controller
                                    control={control}
                                    name="billing_interval"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className="w-full h-8">
                                                <SelectValue>
                                                    {field.value ? t(`plans.interval.${field.value}`) : null}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="day">{t("plans.interval.day", { defaultValue: "Daily" })}</SelectItem>
                                                <SelectItem value="week">{t("plans.interval.week", { defaultValue: "Weekly" })}</SelectItem>
                                                <SelectItem value="month">{t("plans.interval.month", { defaultValue: "Monthly" })}</SelectItem>
                                                <SelectItem value="year">{t("plans.interval.year", { defaultValue: "Yearly" })}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </Field>

                            <Field>
                                <FieldLabel>
                                    {t("plans.fields.trial_days", { defaultValue: "Trial Days" })}
                                </FieldLabel>
                                <NumericInput
                                    allowDecimal={false}
                                    {...register("trial_days")}

                                />
                                {errors.trial_days && <FieldError>{t(errors.trial_days.message as any)}</FieldError>}
                            </Field>

                            <Field>
                                <FieldLabel>
                                    {t("plans.fields.grace_days", { defaultValue: "Grace Days" })}
                                </FieldLabel>
                                <NumericInput
                                    allowDecimal={false}
                                    {...register("grace_days")}

                                />
                                {errors.grace_days && <FieldError>{t(errors.grace_days.message as any)}</FieldError>}
                            </Field>

                            <Field>
                                <FieldLabel>
                                    {t("plans.fields.sort_order", { defaultValue: "Display Order" })}
                                </FieldLabel>
                                <NumericInput
                                    allowDecimal={false}
                                    {...register("sort_order")}

                                />
                                {errors.sort_order && <FieldError>{t(errors.sort_order.message as any)}</FieldError>}
                            </Field>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => router.push(`/${currentLocale}/website/plans`)}
                            disabled={isPending}
                        >
                            {t("buttons.cancel", { defaultValue: "Cancel" })}
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isPending}>
                            {isPending ? t("actions.loading", { defaultValue: "Saving..." }) : t("buttons.save", { defaultValue: "Save" })}
                        </Button>
                    </div>
                </div>

            </div>
        </form>
    );
}

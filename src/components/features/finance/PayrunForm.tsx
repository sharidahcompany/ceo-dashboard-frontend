"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldSet,
} from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SelectEntity, EntityOption } from "@/components/ui/select-entity";

import {
    getPayrun,
    createPayrun,
    updatePayrun,
    PayrunFormData,
    PayrunStatus,
} from "@/actions/finance/payrun.actions";
import { getCurrencies } from "@/actions/common/common.actions";

const payrunSchema = z.object({
    name: z.string().min(1, { message: "validation.required" }),
    period_start: z.string().min(1, { message: "validation.required" }),
    period_end: z.string().min(1, { message: "validation.required" }),
    pay_date: z.string().min(1, { message: "validation.required" }),
    currency: z.string().min(1, { message: "validation.required" }),
    exchange_rate: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null, {
        message: "validation.required",
    }),
    total_gross: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null && v !== undefined, {
        message: "validation.required",
    }),
    total_deductions: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null && v !== undefined, {
        message: "validation.required",
    }),
    total_net: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null && v !== undefined, {
        message: "validation.required",
    }),
    status: z.enum(["draft", "processed", "approved", "paid"]).optional(),
});

type PayrunFormValues = z.infer<typeof payrunSchema>;

export default function PayrunForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const payrunId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!payrunId);

    const [currencies, setCurrencies] = useState<EntityOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<PayrunFormValues>({
        resolver: zodResolver(payrunSchema),
        defaultValues: {
            name: "",
            period_start: "",
            period_end: "",
            pay_date: "",
            currency: "",
            exchange_rate: 1,
            total_gross: 0,
            total_deductions: 0,
            total_net: 0,
            status: "draft",
        },
    });

    useEffect(() => {
        const loadOptions = async () => {
            setOptionsLoading(true);
            const currenciesRes = await getCurrencies();
            if (currenciesRes.success) {
                setCurrencies(currenciesRes.data.map((c) => ({ id: c.code, label: `${c.code} - ${c.label}` })));
            }
            setOptionsLoading(false);
        };
        loadOptions();
    }, []);

    useEffect(() => {
        if (!payrunId) return;
        const loadPayrun = async () => {
            const res = await getPayrun(payrunId);
            if (res.success) {
                const pr = res.data;
                setValue("name", pr.name || "");
                setValue("period_start", pr.period_start?.slice(0, 10) || "");
                setValue("period_end", pr.period_end?.slice(0, 10) || "");
                setValue("pay_date", pr.pay_date?.slice(0, 10) || "");
                setValue("currency", pr.currency?.code || "");
                setValue("exchange_rate", pr.exchange_rate);
                setValue("total_gross", pr.total_gross ?? 0);
                setValue("total_deductions", pr.total_deductions ?? 0);
                setValue("total_net", pr.total_net ?? 0);
                setValue("status", pr.status || "draft");
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadPayrun();
    }, [payrunId, setValue]);

    const onSubmit = (values: PayrunFormValues) => {
        startTransition(async () => {
            const payload: PayrunFormData = { ...values };

            const res = payrunId
                ? await updatePayrun(payrunId, payload)
                : await createPayrun(payload);

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
                            {payrunId ? t("attributes.edit_payrun") || "Edit Payrun" : t("attributes.create_payrun") || "Create Payrun"}
                        </CardTitle>
                        <CardDescription>{t("routes.finance") || "Finance"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                <Field>
                                    <FieldLabel>{t("attributes.name") || "Name"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("name")} placeholder={t("attributes.name") || "Name"} />
                                        {errors.name && <FieldError>{t(errors.name.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.currency") || "Currency"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="currency"
                                            options={currencies}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_currency") || "Select currency"}
                                        />
                                        {errors.currency && <FieldError>{t(errors.currency.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.period_start") || "Period Start"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="date" {...register("period_start")} />
                                        {errors.period_start && <FieldError>{t(errors.period_start.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.period_end") || "Period End"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="date" {...register("period_end")} />
                                        {errors.period_end && <FieldError>{t(errors.period_end.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.pay_date") || "Pay Date"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="date" {...register("pay_date")} />
                                        {errors.pay_date && <FieldError>{t(errors.pay_date.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.exchange_rate") || "Exchange Rate"}</FieldLabel>
                                    <FieldContent>
                                        <NumericInput {...register("exchange_rate")} placeholder="1" />
                                        {errors.exchange_rate && <FieldError>{t(errors.exchange_rate.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.status") || "Status"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue>{(value: string) => t(`enums.documentStatus.${value}`)}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(["draft", "processed", "approved", "paid"] as PayrunStatus[]).map((s) => (
                                                            <SelectItem key={s} value={s}>{t(`enums.documentStatus.${s}`)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.total_gross") || "Total Gross"}</FieldLabel>
                                    <FieldContent>
                                        <NumericInput {...register("total_gross")} />
                                        {errors.total_gross && <FieldError>{t(errors.total_gross.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.total_deductions") || "Total Deductions"}</FieldLabel>
                                    <FieldContent>
                                        <NumericInput {...register("total_deductions")} />
                                        {errors.total_deductions && <FieldError>{t(errors.total_deductions.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.total_net") || "Total Net"}</FieldLabel>
                                    <FieldContent>
                                        <NumericInput {...register("total_net")} />
                                        {errors.total_net && <FieldError>{t(errors.total_net.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
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

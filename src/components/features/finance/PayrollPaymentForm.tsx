"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    getPayrollPayment,
    createPayrollPayment,
    PayrollPaymentFormData,
} from "@/actions/finance/payroll-payment.actions";
import { getPayrolls } from "@/actions/finance/payroll.actions";
import { getBankAccounts } from "@/actions/finance/bank-account.actions";
import { getCurrencies } from "@/actions/common/common.actions";

const lineItemSchema = z.object({
    payroll_id: z.union([z.string(), z.number()]).refine((v) => !!v, { message: "validation.required" }),
    amount: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null, { message: "validation.required" }),
});

const payrollPaymentSchema = z.object({
    payment_date: z.string().min(1, { message: "validation.required" }),
    account_id: z.union([z.string(), z.number()]).refine((v) => !!v, { message: "validation.required" }),
    currency: z.string().min(1, { message: "validation.required" }),
    exchange_rate: z.union([z.string(), z.number()]),
    reference: z.string().optional(),
    items: z.array(lineItemSchema).min(1, { message: "validation.required" }),
});

type PayrollPaymentFormValues = z.infer<typeof payrollPaymentSchema>;

const emptyLineItem = { payroll_id: "", amount: 0 };

export default function PayrollPaymentForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const paymentId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!paymentId);

    const [payrolls, setPayrolls] = useState<EntityOption[]>([]);
    const [bankAccounts, setBankAccounts] = useState<EntityOption[]>([]);
    const [currencies, setCurrencies] = useState<EntityOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

    const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<PayrollPaymentFormValues>({
        resolver: zodResolver(payrollPaymentSchema),
        defaultValues: {
            payment_date: "",
            account_id: "",
            currency: "",
            exchange_rate: 1,
            reference: "",
            items: [emptyLineItem],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });

    useEffect(() => {
        const loadOptions = async () => {
            setOptionsLoading(true);
            const [payrollsRes, bankAccountsRes, currenciesRes] = await Promise.all([
                getPayrolls({ limit: 1000 }),
                getBankAccounts({ limit: 1000 }),
                getCurrencies(),
            ]);

            if (payrollsRes.success) {
                setPayrolls(
                    payrollsRes.data.data.map((p) => ({
                        id: p.id,
                        label: `${p.employee_name || p.user?.name || p.user_id} - ${p.net_salary}`,
                    }))
                );
            }
            if (bankAccountsRes.success) {
                setBankAccounts(bankAccountsRes.data.data.map((b) => ({ id: b.id, label: b.name_localized || b.name?.en })));
            }
            if (currenciesRes.success) {
                setCurrencies(currenciesRes.data.map((c) => ({ id: c.code, label: `${c.code} - ${c.label}` })));
            }
            setOptionsLoading(false);
        };
        loadOptions();
    }, []);

    useEffect(() => {
        if (!paymentId) return;
        const loadPayment = async () => {
            const res = await getPayrollPayment(paymentId);
            if (res.success) {
                const p = res.data;
                setValue("payment_date", p.payment_date?.slice(0, 10) || "");
                setValue("currency", p.currency);
                setValue("exchange_rate", p.exchange_rate);
                setValue("reference", p.reference || "");
                setValue("items", [{ payroll_id: String(p.payroll_id), amount: p.amount }]);
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadPayment();
    }, [paymentId, setValue]);

    const onSubmit = (values: PayrollPaymentFormValues) => {
        startTransition(async () => {
            const payload: PayrollPaymentFormData = { ...values };

            const res = await createPayrollPayment(payload);

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
                        <CardTitle>{t("attributes.create_payroll_payment") || "Create Payroll Payment"}</CardTitle>
                        <CardDescription>{t("routes.finance") || "Finance"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                <Field>
                                    <FieldLabel>{t("attributes.payment_date") || "Payment Date"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="date" {...register("payment_date")} />
                                        {errors.payment_date && <FieldError>{t(errors.payment_date.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.bank_account") || "Bank Account"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity control={control} name="account_id" options={bankAccounts} loading={optionsLoading} />
                                        {errors.account_id && <FieldError>{t(errors.account_id.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.currency") || "Currency"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity control={control} name="currency" options={currencies} loading={optionsLoading} />
                                        {errors.currency && <FieldError>{t(errors.currency.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.exchange_rate") || "Exchange Rate"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("exchange_rate", { valueAsNumber: true })} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.reference") || "Reference"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("reference")} />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <Card className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <div>
                            <CardTitle>{t("attributes.payroll_lines") || "Payroll Lines"}</CardTitle>
                            <CardDescription>{t("attributes.payroll_lines_description") || "Payrolls covered by this payment"}</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => append(emptyLineItem)}>
                            <Plus className="size-3.5" />
                            {t("buttons.add") || "Add"}
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Field>
                                            <FieldLabel>{t("attributes.payroll") || "Payroll"}</FieldLabel>
                                            <FieldContent>
                                                <SelectEntity control={control} name={`items.${index}.payroll_id`} options={payrolls} loading={optionsLoading} />
                                                {errors.items?.[index]?.payroll_id && (
                                                    <FieldError>{t(errors.items[index]?.payroll_id?.message!)}</FieldError>
                                                )}
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.amount") || "Amount"}</FieldLabel>
                                            <FieldContent>
                                                <Input type="number" step="any" {...register(`items.${index}.amount`, { valueAsNumber: true })} />
                                                {errors.items?.[index]?.amount && (
                                                    <FieldError>{t(errors.items[index]?.amount?.message!)}</FieldError>
                                                )}
                                            </FieldContent>
                                        </Field>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon-sm"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                        className="mt-6"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {errors.items?.message && <FieldError>{t(errors.items.message)}</FieldError>}
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

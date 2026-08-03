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
import { Input } from "@/components/ui/input";
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
import { SelectUser } from "@/components/ui/select-user";
import { UserResource } from "@/actions/workspace/user.actions";

import {
    getPayroll,
    createPayroll,
    updatePayroll,
    PayrollFormData,
    PayrollPaymentStatus,
} from "@/actions/finance/payroll.actions";
import { getPayruns } from "@/actions/finance/payrun.actions";

const payrollSchema = z.object({
    payrun_id: z.union([z.string(), z.number()]).optional().nullable(),
    user_id: z.union([z.string(), z.number()]).refine((v) => !!v, {
        message: "validation.required",
    }),
    gross_salary: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null, {
        message: "validation.required",
    }),
    total_deductions: z.union([z.string(), z.number()]).optional(),
    net_salary: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null, {
        message: "validation.required",
    }),
    paid_amount: z.union([z.string(), z.number()]).optional(),
    remaining_amount: z.union([z.string(), z.number()]).optional(),
    payment_status: z.enum(["unpaid", "partial", "paid"]).optional(),
});

type PayrollFormValues = z.infer<typeof payrollSchema>;

export default function PayrollForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const payrollId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!payrollId);

    const [payruns, setPayruns] = useState<EntityOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [initialUser, setInitialUser] = useState<UserResource | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<PayrollFormValues>({
        resolver: zodResolver(payrollSchema),
        defaultValues: {
            payrun_id: null,
            user_id: "",
            gross_salary: "",
            total_deductions: "",
            net_salary: "",
            paid_amount: "",
            remaining_amount: "",
            payment_status: "unpaid",
        },
    });

    useEffect(() => {
        const loadOptions = async () => {
            setOptionsLoading(true);
            const payrunsRes = await getPayruns({ limit: 1000 });
            if (payrunsRes.success) {
                setPayruns(payrunsRes.data.data.map((pr) => ({ id: pr.id, label: pr.name })));
            }
            setOptionsLoading(false);
        };
        loadOptions();
    }, []);

    useEffect(() => {
        if (!payrollId) return;
        const loadPayroll = async () => {
            const res = await getPayroll(payrollId);
            if (res.success) {
                const p = res.data;
                setValue("payrun_id", null);
                setValue("user_id", p.user_id ? String(p.user_id) : "");
                setValue("gross_salary", p.gross_salary);
                setValue("total_deductions", p.total_deductions ?? "");
                setValue("net_salary", p.net_salary);
                setValue("paid_amount", p.paid_amount ?? "");
                setValue("remaining_amount", p.remaining_amount ?? "");
                setValue("payment_status", p.payment_status || "unpaid");
                if (p.user?.id) {
                    setInitialUser({
                        id: String(p.user.id),
                        first_name: p.user.name || p.employee_name || "",
                        last_name: "",
                        email: "",
                        avatar: null,
                    });
                }
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadPayroll();
    }, [payrollId, setValue]);

    const onSubmit = (values: PayrollFormValues) => {
        startTransition(async () => {
            const payload: PayrollFormData = {
                ...values,
                payrun_id: values.payrun_id || null,
            };

            const res = payrollId
                ? await updatePayroll(payrollId, payload)
                : await createPayroll(payload);

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
                            {payrollId ? t("attributes.edit_payroll") || "Edit Payroll" : t("attributes.create_payroll") || "Create Payroll"}
                        </CardTitle>
                        <CardDescription>{t("routes.finance") || "Finance"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                <Field>
                                    <FieldLabel>{t("attributes.employee") || "Employee"}</FieldLabel>
                                    <FieldContent>
                                        <SelectUser control={control} name="user_id" initialUser={initialUser} isTenantOnly />
                                        {errors.user_id && <FieldError>{t(errors.user_id.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.payrun") || "Payrun"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="payrun_id"
                                            options={payruns}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_payrun") || "Select payrun"}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.gross_salary") || "Gross Salary"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("gross_salary")} />
                                        {errors.gross_salary && <FieldError>{t(errors.gross_salary.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.total_deductions") || "Total Deductions"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("total_deductions")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.net_salary") || "Net Salary"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("net_salary")} />
                                        {errors.net_salary && <FieldError>{t(errors.net_salary.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.paid_amount") || "Paid Amount"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("paid_amount")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.remaining_amount") || "Remaining Amount"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("remaining_amount")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.payment_status") || "Payment Status"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="payment_status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue>{(value: string) => t(`enums.documentStatus.${value}`)}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(["unpaid", "partial", "paid"] as PayrollPaymentStatus[]).map((s) => (
                                                            <SelectItem key={s} value={s}>{t(`enums.documentStatus.${s}`)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
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

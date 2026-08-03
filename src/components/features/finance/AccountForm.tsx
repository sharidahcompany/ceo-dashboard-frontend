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
import { Checkbox } from "@/components/ui/checkbox";
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
    getAccount,
    getAccounts,
    createAccount,
    updateAccount,
    AccountFormData,
    AccountClassification,
    ActivityType,
} from "@/actions/finance/account.actions";
import { getBankAccounts } from "@/actions/finance/bank-account.actions";

const accountSchema = z.object({
    classification: z.enum(["REVENUE", "EXPENSE", "ASSET", "LIABILITY", "EQUITY"]),
    name: z.object({
        ar: z.string().min(1, { message: "validation.required" }),
        en: z.string().min(1, { message: "validation.required" }),
    }),
    activity: z.enum(["CASH", "OPERATING", "INVESTING", "FINANCING"]),
    parent_id: z.union([z.string(), z.number()]).refine((v) => !!v, {
        message: "validation.required",
    }),
    show_in_expense_claims: z.boolean().optional(),
    bank_account_id: z.union([z.string(), z.number()]).optional().nullable(),
    is_payment_enabled: z.boolean().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

const classifications: AccountClassification[] = ["REVENUE", "EXPENSE", "ASSET", "LIABILITY", "EQUITY"];
const activities: ActivityType[] = ["CASH", "OPERATING", "INVESTING", "FINANCING"];

export default function AccountForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const accountId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!accountId);

    const [accounts, setAccounts] = useState<EntityOption[]>([]);
    const [bankAccounts, setBankAccounts] = useState<EntityOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<AccountFormValues>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            classification: "ASSET",
            name: { ar: "", en: "" },
            activity: "OPERATING",
            parent_id: "",
            show_in_expense_claims: false,
            bank_account_id: null,
            is_payment_enabled: false,
        },
    });

    useEffect(() => {
        const loadOptions = async () => {
            setOptionsLoading(true);
            const [accountsRes, bankAccountsRes] = await Promise.all([
                getAccounts(),
                getBankAccounts({ limit: 1000 }),
            ]);

            if (accountsRes.success) {
                setAccounts(
                    accountsRes.data
                        .filter((a) => String(a.id) !== String(accountId))
                        .map((a) => ({ id: a.id, label: `${a.account_code} - ${a.name_localized || a.name?.en}` }))
                );
            }
            if (bankAccountsRes.success) {
                setBankAccounts(
                    bankAccountsRes.data.data.map((b) => ({ id: b.id, label: b.name_localized || b.name?.en }))
                );
            }
            setOptionsLoading(false);
        };
        loadOptions();
    }, [accountId]);

    useEffect(() => {
        if (!accountId) return;
        const loadAccount = async () => {
            const res = await getAccount(accountId);
            if (res.success) {
                const acc = res.data;
                setValue("classification", acc.classification);
                setValue("name", { ar: acc.name?.ar || "", en: acc.name?.en || "" });
                setValue("activity", acc.activity?.value || "OPERATING");
                setValue("parent_id", acc.parent_id ? String(acc.parent_id) : "");
                setValue("show_in_expense_claims", !!acc.show_in_expense_claims);
                setValue("bank_account_id", acc.bank_account_id ? String(acc.bank_account_id) : null);
                setValue("is_payment_enabled", !!acc.is_payment_enabled);
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadAccount();
    }, [accountId, setValue]);

    const onSubmit = (values: AccountFormValues) => {
        startTransition(async () => {
            const payload: AccountFormData = {
                ...values,
                bank_account_id: values.bank_account_id || null,
            };

            const res = accountId
                ? await updateAccount(accountId, payload)
                : await createAccount(payload);

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
                            {accountId ? t("attributes.edit_account") || "Edit Account" : t("attributes.create_account") || "Create Account"}
                        </CardTitle>
                        <CardDescription>{t("routes.finance") || "Finance"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                <Field>
                                    <FieldLabel>{t("attributes.classification") || "Classification"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="classification"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue>{(value: string) => t(`enums.accountClassification.${value}`)}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {classifications.map((c) => (
                                                            <SelectItem key={c} value={c}>{t(`enums.accountClassification.${c}`)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.classification && <FieldError>{t(errors.classification.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.activity") || "Activity"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="activity"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue>{(value: string) => t(`enums.activityType.${value}`)}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {activities.map((a) => (
                                                            <SelectItem key={a} value={a}>{t(`enums.activityType.${a}`)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.activity && <FieldError>{t(errors.activity.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.name_en")}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("name.en")} placeholder={t("attributes.name_en")} />
                                        {errors.name?.en && <FieldError>{t(errors.name.en.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.name_ar")}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("name.ar")} placeholder={t("attributes.name_ar")} className="text-right" dir="rtl" />
                                        {errors.name?.ar && <FieldError>{t(errors.name.ar.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.parent_account") || "Parent Account"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="parent_id"
                                            options={accounts}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_account") || "Select parent account"}
                                        />
                                        {errors.parent_id && <FieldError>{t(errors.parent_id.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.bank_account") || "Bank Account"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="bank_account_id"
                                            options={bankAccounts}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_bank_account") || "Select bank account"}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldContent>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <Controller
                                                name="show_in_expense_claims"
                                                control={control}
                                                render={({ field }) => (
                                                    <Checkbox
                                                        checked={!!field.value}
                                                        onCheckedChange={(checked) => field.onChange(!!checked)}
                                                    />
                                                )}
                                            />
                                            <span className="text-sm">
                                                {t("attributes.show_in_expense_claims") || "Show in expense claims"}
                                            </span>
                                        </label>
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldContent>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <Controller
                                                name="is_payment_enabled"
                                                control={control}
                                                render={({ field }) => (
                                                    <Checkbox
                                                        checked={!!field.value}
                                                        onCheckedChange={(checked) => field.onChange(!!checked)}
                                                    />
                                                )}
                                            />
                                            <span className="text-sm">
                                                {t("attributes.is_payment_enabled") || "Payment enabled"}
                                            </span>
                                        </label>
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

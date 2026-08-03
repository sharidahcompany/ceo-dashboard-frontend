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

import {
    getBankAccount,
    createBankAccount,
    updateBankAccount,
    BankAccountFormData,
    BankAccountType,
} from "@/actions/finance/bank-account.actions";
import { getCurrencies } from "@/actions/common/common.actions";

const bankAccountSchema = z.object({
    name: z.object({
        ar: z.string().min(1, { message: "validation.required" }),
        en: z.string().min(1, { message: "validation.required" }),
    }),
    type: z.enum(["BANK_ACCOUNT", "CREDIT_CARD", "PETTY_CASH"]),
    currency: z.string().min(1, { message: "validation.required" }),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

const types: BankAccountType[] = ["BANK_ACCOUNT", "CREDIT_CARD", "PETTY_CASH"];

export default function BankAccountForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const bankAccountId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!bankAccountId);

    const [currencies, setCurrencies] = useState<EntityOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<BankAccountFormValues>({
        resolver: zodResolver(bankAccountSchema),
        defaultValues: {
            name: { ar: "", en: "" },
            type: "BANK_ACCOUNT",
            currency: "",
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
        if (!bankAccountId) return;
        const loadBankAccount = async () => {
            const res = await getBankAccount(bankAccountId);
            if (res.success) {
                const acc = res.data;
                setValue("name", { ar: acc.name?.ar || "", en: acc.name?.en || "" });
                setValue("type", acc.type?.value || "BANK_ACCOUNT");
                setValue("currency", acc.currency_code || acc.currency || "");
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadBankAccount();
    }, [bankAccountId, setValue]);

    const onSubmit = (values: BankAccountFormValues) => {
        startTransition(async () => {
            const payload: BankAccountFormData = { ...values };

            const res = bankAccountId
                ? await updateBankAccount(bankAccountId, payload)
                : await createBankAccount(payload);

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
                            {bankAccountId ? t("attributes.edit_bank_account") || "Edit Bank Account" : t("attributes.create_bank_account") || "Create Bank Account"}
                        </CardTitle>
                        <CardDescription>{t("routes.finance") || "Finance"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
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
                                    <FieldLabel>{t("attributes.type") || "Type"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="type"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue>{(value: string) => t(`enums.bankAccountType.${value}`)}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {types.map((tp) => (
                                                            <SelectItem key={tp} value={tp}>{t(`enums.bankAccountType.${tp}`)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.type && <FieldError>{t(errors.type.message!)}</FieldError>}
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

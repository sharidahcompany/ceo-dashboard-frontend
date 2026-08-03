"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldSet,
    FieldSeparator,
} from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SelectEntity, EntityOption } from "@/components/ui/select-entity";
import { SelectBranch } from "@/components/ui/select-branch";

import {
    getJournal,
    createJournal,
    updateJournal,
    JournalFormData,
    JournalStatus,
} from "@/actions/finance/journal.actions";
import { getAccounts } from "@/actions/finance/account.actions";
import { getTaxRates } from "@/actions/finance/tax-rate.actions";
import { getCustomers } from "@/actions/finance/customer.actions";
import { getProjects } from "@/actions/projects/projects.actions";
import { getCostCenters } from "@/actions/finance/cost-center.actions";
import { getCurrencies } from "@/actions/common/common.actions";

const lineItemSchema = z.object({
    account_id: z.union([z.string(), z.number()]).refine((v) => !!v, { message: "validation.required" }),
    description: z.string().optional(),
    currency: z.string().min(1, { message: "validation.required" }),
    exchange_rate: z.union([z.string(), z.number()]),
    debit: z.union([z.string(), z.number()]).optional(),
    credit: z.union([z.string(), z.number()]).optional(),
    debit_dc: z.union([z.string(), z.number()]).optional(),
    credit_dc: z.union([z.string(), z.number()]).optional(),
    tax_rate_id: z.union([z.string(), z.number()]).optional().nullable(),
    customer_id: z.union([z.string(), z.number()]).optional().nullable(),
    project_id: z.union([z.string(), z.number()]).optional().nullable(),
    branch_id: z.union([z.string(), z.number()]).optional().nullable(),
    cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
});

const journalSchema = z.object({
    status: z.enum(["DRAFT", "POSTED"]),
    date: z.string().min(1, { message: "validation.required" }),
    reference: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(lineItemSchema).min(1, { message: "validation.required" }),
});

type JournalFormValues = z.infer<typeof journalSchema>;

const emptyLineItem = {
    account_id: "",
    description: "",
    currency: "",
    exchange_rate: 1,
    debit: 0,
    credit: 0,
    tax_rate_id: null,
    customer_id: null,
    project_id: null,
    branch_id: null,
    cost_center_id: null,
};

export default function JournalForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const journalId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!journalId);

    const [accounts, setAccounts] = useState<EntityOption[]>([]);
    const [taxRates, setTaxRates] = useState<EntityOption[]>([]);
    const [customers, setCustomers] = useState<EntityOption[]>([]);
    const [projects, setProjects] = useState<EntityOption[]>([]);
    const [costCenters, setCostCenters] = useState<EntityOption[]>([]);
    const [currencies, setCurrencies] = useState<EntityOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

    const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<JournalFormValues>({
        resolver: zodResolver(journalSchema),
        defaultValues: {
            status: "DRAFT",
            date: "",
            reference: "",
            notes: "",
            items: [emptyLineItem, { ...emptyLineItem }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });

    useEffect(() => {
        const loadOptions = async () => {
            setOptionsLoading(true);
            const [accountsRes, taxRatesRes, customersRes, projectsRes, costCentersRes, currenciesRes] = await Promise.all([
                getAccounts(),
                getTaxRates({ limit: 1000 }),
                getCustomers({ limit: 1000 }),
                getProjects(),
                getCostCenters({ limit: 1000 }),
                getCurrencies(),
            ]);

            if (accountsRes.success) {
                setAccounts(accountsRes.data.map((a) => ({ id: a.id, label: `${a.account_code} - ${a.name_localized || a.name?.en}` })));
            }
            if (taxRatesRes.success) {
                setTaxRates(taxRatesRes.data.data.map((tr) => ({ id: tr.id, label: tr.name_localized || tr.name?.en })));
            }
            if (customersRes.success) {
                setCustomers(customersRes.data.data.map((c) => ({ id: c.id, label: c.name_localized || c.name?.en })));
            }
            if (projectsRes.success) {
                setProjects(projectsRes.data.map((p) => ({ id: p.id, label: p.name })));
            }
            if (costCentersRes.success) {
                setCostCenters(costCentersRes.data.data.map((cc) => ({ id: cc.id, label: cc.name_localized || cc.name?.en })));
            }
            if (currenciesRes.success) {
                setCurrencies(currenciesRes.data.map((c) => ({ id: c.code, label: `${c.code} - ${c.label}` })));
            }
            setOptionsLoading(false);
        };
        loadOptions();
    }, []);

    useEffect(() => {
        if (!journalId) return;
        const loadJournal = async () => {
            const res = await getJournal(journalId);
            if (res.success) {
                const j = res.data;
                setValue("status", j.status?.value || "DRAFT");
                setValue("date", j.date?.slice(0, 10) || "");
                setValue("reference", j.reference || "");
                setValue("notes", j.notes || "");
                if (j.items?.length) {
                    setValue(
                        "items",
                        j.items.map((it) => ({
                            account_id: String(it.account_id),
                            description: it.description || "",
                            currency: it.currency,
                            exchange_rate: it.exchange_rate,
                            debit: it.debit || 0,
                            credit: it.credit || 0,
                            tax_rate_id: it.tax_rate_id ? String(it.tax_rate_id) : null,
                            customer_id: it.customer_id ? String(it.customer_id) : null,
                            project_id: it.project_id ? String(it.project_id) : null,
                            branch_id: it.branch_id ? String(it.branch_id) : null,
                            cost_center_id: it.cost_center_id ? String(it.cost_center_id) : null,
                        }))
                    );
                }
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadJournal();
    }, [journalId, setValue]);

    const onSubmit = (values: JournalFormValues) => {
        startTransition(async () => {
            const payload: JournalFormData = {
                ...values,
                items: values.items.map((item) => ({
                    ...item,
                    tax_rate_id: item.tax_rate_id || null,
                    customer_id: item.customer_id || null,
                    project_id: item.project_id || null,
                    branch_id: item.branch_id || null,
                    cost_center_id: item.cost_center_id || null,
                })),
            };

            const res = journalId ? await updateJournal(journalId, payload) : await createJournal(payload);

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
                            {journalId ? t("attributes.edit_journal") || "Edit Journal Entry" : t("attributes.create_journal") || "Create Journal Entry"}
                        </CardTitle>
                        <CardDescription>{t("routes.finance") || "Finance"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-3 md:gap-5">
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
                                                        {(["DRAFT", "POSTED"] as JournalStatus[]).map((s) => (
                                                            <SelectItem key={s} value={s}>{t(`enums.documentStatus.${s}`)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.date") || "Date"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="date" {...register("date")} />
                                        {errors.date && <FieldError>{t(errors.date.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.reference") || "Reference"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("reference")} />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>

                            <FieldSeparator />

                            <Field>
                                <FieldLabel>{t("attributes.notes") || "Notes"}</FieldLabel>
                                <FieldContent>
                                    <Textarea {...register("notes")} rows={3} />
                                </FieldContent>
                            </Field>
                        </FieldSet>
                    </CardContent>
                </Card>

                <Card className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <div>
                            <CardTitle>{t("attributes.line_items") || "Line Items"}</CardTitle>
                            <CardDescription>{t("attributes.journal_lines_description") || "Debit and credit lines must balance"}</CardDescription>
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
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <Field className="md:col-span-2">
                                            <FieldLabel>{t("attributes.account") || "Account"}</FieldLabel>
                                            <FieldContent>
                                                <SelectEntity control={control} name={`items.${index}.account_id`} options={accounts} loading={optionsLoading} />
                                                {errors.items?.[index]?.account_id && (
                                                    <FieldError>{t(errors.items[index]?.account_id?.message!)}</FieldError>
                                                )}
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.currency") || "Currency"}</FieldLabel>
                                            <FieldContent>
                                                <SelectEntity control={control} name={`items.${index}.currency`} options={currencies} loading={optionsLoading} />
                                                {errors.items?.[index]?.currency && (
                                                    <FieldError>{t(errors.items[index]?.currency?.message!)}</FieldError>
                                                )}
                                            </FieldContent>
                                        </Field>

                                        <Field className="md:col-span-2">
                                            <FieldLabel>{t("attributes.description") || "Description"}</FieldLabel>
                                            <FieldContent>
                                                <Input {...register(`items.${index}.description`)} />
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.exchange_rate") || "Exchange Rate"}</FieldLabel>
                                            <FieldContent>
                                                <Input type="number" step="any" {...register(`items.${index}.exchange_rate`, { valueAsNumber: true })} />
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.debit") || "Debit"}</FieldLabel>
                                            <FieldContent>
                                                <Input type="number" step="any" {...register(`items.${index}.debit`, { valueAsNumber: true })} />
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.credit") || "Credit"}</FieldLabel>
                                            <FieldContent>
                                                <Input type="number" step="any" {...register(`items.${index}.credit`, { valueAsNumber: true })} />
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.tax_rate") || "Tax Rate"}</FieldLabel>
                                            <FieldContent>
                                                <SelectEntity control={control} name={`items.${index}.tax_rate_id`} options={taxRates} loading={optionsLoading} />
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.customer") || "Customer"}</FieldLabel>
                                            <FieldContent>
                                                <SelectEntity control={control} name={`items.${index}.customer_id`} options={customers} loading={optionsLoading} />
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.project") || "Project"}</FieldLabel>
                                            <FieldContent>
                                                <SelectEntity control={control} name={`items.${index}.project_id`} options={projects} loading={optionsLoading} />
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.branch") || "Branch"}</FieldLabel>
                                            <FieldContent>
                                                <SelectBranch control={control} name={`items.${index}.branch_id`} />
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.cost_center") || "Cost Center"}</FieldLabel>
                                            <FieldContent>
                                                <SelectEntity control={control} name={`items.${index}.cost_center_id`} options={costCenters} loading={optionsLoading} />
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

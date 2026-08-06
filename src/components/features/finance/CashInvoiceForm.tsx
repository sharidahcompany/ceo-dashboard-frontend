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
import { Input, NumericInput } from "@/components/ui/input";
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
import { LineItemsTotals } from "./LineItemsTotals";
import { getErrorMessage } from "@/lib/utils";

import {
    getCashInvoice,
    createCashInvoice,
    updateCashInvoice,
    CashInvoiceFormData,
    CashInvoiceStatus,
    TaxAmountType,
} from "@/actions/finance/cash-invoice.actions";
import { getCustomers } from "@/actions/finance/customer.actions";
import { getBankAccounts } from "@/actions/finance/bank-account.actions";
import { getItems } from "@/actions/finance/item.actions";
import { getTaxRates } from "@/actions/finance/tax-rate.actions";
import { getCostCenters } from "@/actions/finance/cost-center.actions";
import { getWarehouses } from "@/actions/finance/warehouse.actions";
import { getProjects } from "@/actions/projects/projects.actions";
import { getCurrencies } from "@/actions/common/common.actions";

const lineItemSchema = z.object({
    description: z.string().min(1, { message: "validation.required" }),
    quantity: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, {
        message: "validation.required",
    }),
    price: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null, {
        message: "validation.required",
    }),
    item_id: z.union([z.string(), z.number()]).optional().nullable(),
    tax_rate_id: z.union([z.string(), z.number()]).optional().nullable(),
    cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
    discount_percent: z.union([z.string(), z.number()]).optional(),
});

const cashInvoiceSchema = z.object({
    status: z.enum(["DRAFT", "PAID"]).optional(),
    customer_id: z.union([z.string(), z.number()]).refine((v) => !!v, {
        message: "validation.required",
    }),
    account_id: z.union([z.string(), z.number()]).refine((v) => !!v, {
        message: "validation.required",
    }),
    invoice_number: z.string().optional(),
    currency: z.string().min(1, { message: "validation.required" }),
    exchange_rate: z.union([z.string(), z.number()]),
    date: z.string().min(1, { message: "validation.required" }),
    purchase_order: z.string().optional(),
    reference: z.string().optional(),
    project_id: z.union([z.string(), z.number()]).optional().nullable(),
    warehouse_id: z.union([z.string(), z.number()]).optional().nullable(),
    tax_amount_type: z.enum(["EXCLUSIVE", "INCLUSIVE"]),
    notes: z.string().optional(),
    items: z.array(lineItemSchema).min(1, { message: "validation.required" }),
});

type CashInvoiceFormValues = z.infer<typeof cashInvoiceSchema>;

const emptyLineItem = {
    description: "",
    quantity: 1,
    price: 0,
    item_id: null,
    tax_rate_id: null,
    cost_center_id: null,
    discount_percent: 0,
};

export default function CashInvoiceForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const cashInvoiceId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!cashInvoiceId);

    const [customers, setCustomers] = useState<EntityOption[]>([]);
    const [bankAccounts, setBankAccounts] = useState<EntityOption[]>([]);
    const [items, setItems] = useState<EntityOption[]>([]);
    const [taxRates, setTaxRates] = useState<(EntityOption & { rate: number })[]>([]);
    const [costCenters, setCostCenters] = useState<EntityOption[]>([]);
    const [warehouses, setWarehouses] = useState<EntityOption[]>([]);
    const [projects, setProjects] = useState<EntityOption[]>([]);
    const [currencies, setCurrencies] = useState<(EntityOption & { code: string; symbol: string; currencyLabel: string })[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<CashInvoiceFormValues>({
        resolver: zodResolver(cashInvoiceSchema),
        defaultValues: {
            status: "DRAFT",
            customer_id: "",
            account_id: "",
            invoice_number: "",
            currency: "",
            exchange_rate: 1,
            date: "",
            purchase_order: "",
            reference: "",
            project_id: null,
            warehouse_id: null,
            tax_amount_type: "EXCLUSIVE",
            notes: "",
            items: [emptyLineItem],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });

    useEffect(() => {
        const loadOptions = async () => {
            setOptionsLoading(true);
            const [customersRes, bankAccountsRes, itemsRes, taxRatesRes, costCentersRes, warehousesRes, projectsRes, currenciesRes] =
                await Promise.all([
                    getCustomers({ limit: 1000 }),
                    getBankAccounts({ limit: 1000 }),
                    getItems({ limit: 1000 }),
                    getTaxRates({ limit: 1000 }),
                    getCostCenters({ limit: 1000 }),
                    getWarehouses({ limit: 1000 }),
                    getProjects(),
                    getCurrencies(),
                ]);

            if (customersRes.success) {
                setCustomers(customersRes.data.data.map((c) => ({ id: c.id, label: c.name_localized || c.name?.en || c.name?.ar })));
            }
            if (bankAccountsRes.success) {
                setBankAccounts(bankAccountsRes.data.data.map((a) => ({ id: a.id, label: a.name_localized || a.name?.en || a.name?.ar })));
            }
            if (itemsRes.success) {
                setItems(itemsRes.data.data.map((i) => ({ id: i.id, label: i.name_localized || i.name?.en || i.name?.ar })));
            }
            if (taxRatesRes.success) {
                setTaxRates(taxRatesRes.data.data.map((tr) => ({ id: tr.id, label: `${tr.name_localized || tr.name?.en} (${tr.tax_rate}%)`, rate: Number(tr.tax_rate) || 0 })));
            }
            if (costCentersRes.success) {
                setCostCenters(costCentersRes.data.data.map((cc) => ({ id: cc.id, label: cc.name_localized || cc.name?.en || cc.name?.ar })));
            }
            if (warehousesRes.success) {
                setWarehouses(warehousesRes.data.data.map((w) => ({ id: w.id, label: w.name })));
            }
            if (projectsRes.success) {
                setProjects(projectsRes.data.map((p) => ({ id: p.id, label: p.name })));
            }
            if (currenciesRes.success) {
                setCurrencies(currenciesRes.data.map((c) => ({ id: c.code, label: `${c.code} - ${c.label}`, code: c.code, symbol: c.symbol, currencyLabel: c.label })));
            }
            setOptionsLoading(false);
        };
        loadOptions();
    }, []);

    useEffect(() => {
        if (!cashInvoiceId) return;
        const loadCashInvoice = async () => {
            const res = await getCashInvoice(cashInvoiceId);
            if (res.success) {
                const inv = res.data;
                setValue("status", inv.status);
                setValue("customer_id", String(inv.customer_id));
                setValue("account_id", String(inv.account_id));
                setValue("invoice_number", inv.invoice_number || "");
                setValue("currency", inv.currency);
                setValue("exchange_rate", inv.exchange_rate);
                setValue("date", inv.date?.slice(0, 10) || "");
                setValue("purchase_order", inv.purchase_order || "");
                setValue("reference", inv.reference || "");
                setValue("project_id", inv.project_id ? String(inv.project_id) : null);
                setValue("warehouse_id", inv.warehouse_id ? String(inv.warehouse_id) : null);
                setValue("tax_amount_type", inv.tax_amount_type);
                setValue("notes", inv.notes || "");
                if (inv.items?.length) {
                    setValue(
                        "items",
                        inv.items.map((it) => ({
                            description: it.description,
                            quantity: it.quantity,
                            price: it.price,
                            item_id: it.item_id ? String(it.item_id) : null,
                            tax_rate_id: it.tax_rate_id ? String(it.tax_rate_id) : null,
                            cost_center_id: it.cost_center_id ? String(it.cost_center_id) : null,
                            discount_percent: it.discount_percent,
                        }))
                    );
                }
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadCashInvoice();
    }, [cashInvoiceId, setValue]);

    const onSubmit = (values: CashInvoiceFormValues) => {
        startTransition(async () => {
            const payload: CashInvoiceFormData = {
                ...values,
                project_id: values.project_id || null,
                warehouse_id: values.warehouse_id || null,
                items: values.items.map((item) => ({
                    ...item,
                    item_id: item.item_id || null,
                    tax_rate_id: item.tax_rate_id || null,
                    cost_center_id: item.cost_center_id || null,
                })),
            };

            const res = cashInvoiceId
                ? await updateCashInvoice(cashInvoiceId, payload)
                : await createCashInvoice(payload);

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
                            {cashInvoiceId ? t("attributes.edit_cash_invoice") || "Edit Cash Invoice" : t("attributes.create_cash_invoice") || "Create Cash Invoice"}
                        </CardTitle>
                        <CardDescription>{t("routes.finance") || "Finance"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                <Field>
                                    <FieldLabel>{t("attributes.customer") || "Customer"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="customer_id"
                                            options={customers}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_customer") || "Select customer"}
                                        />
                                        {errors.customer_id && <FieldError>{t(errors.customer_id.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.account") || "Account"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="account_id"
                                            options={bankAccounts}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_account") || "Select account"}
                                        />
                                        {errors.account_id && <FieldError>{t(errors.account_id.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.invoice_number") || "Invoice Number"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("invoice_number")} placeholder={t("attributes.invoice_number") || "Invoice Number"} />
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
                                                        {(["DRAFT", "PAID"] as CashInvoiceStatus[]).map((s) => (
                                                            <SelectItem key={s} value={s}>{t(`enums.documentStatus.${s}`)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.tax_amount_type") || "Tax Amount Type"}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="tax_amount_type"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue>{(value: string) => t(`enums.taxAmountType.${value}`)}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(["EXCLUSIVE", "INCLUSIVE"] as TaxAmountType[]).map((s) => (
                                                            <SelectItem key={s} value={s}>{t(`enums.taxAmountType.${s}`)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
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
                                    <FieldLabel>{t("attributes.exchange_rate") || "Exchange Rate"}</FieldLabel>
                                    <FieldContent>
                                        <NumericInput {...register("exchange_rate")} placeholder="1" />
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
                                    <FieldLabel>{t("attributes.purchase_order") || "Purchase Order"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("purchase_order")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.reference") || "Reference"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("reference")} />
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

                                <Field>
                                    <FieldLabel>{t("attributes.warehouse") || "Warehouse"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="warehouse_id"
                                            options={warehouses}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_warehouse") || "Select warehouse"}
                                        />
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
                            <CardDescription>{t("attributes.line_items_description") || "Items included in this invoice"}</CardDescription>
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
                                        <Field>
                                            <FieldLabel>{t("attributes.item") || "Item"}</FieldLabel>
                                            <FieldContent>
                                                <SelectEntity control={control} name={`items.${index}.item_id`} options={items} loading={optionsLoading} />
                                            </FieldContent>
                                        </Field>

                                        <Field className="md:col-span-2">
                                            <FieldLabel>{t("attributes.description") || "Description"}</FieldLabel>
                                            <FieldContent>
                                                <Input {...register(`items.${index}.description`)} />
                                                {errors.items?.[index]?.description && (
                                                    <FieldError>{t(errors.items[index]?.description?.message!)}</FieldError>
                                                )}
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.quantity") || "Quantity"}</FieldLabel>
                                            <FieldContent>
                                                <NumericInput {...register(`items.${index}.quantity`)} />
                                                {errors.items?.[index]?.quantity && (
                                                    <FieldError>{t(errors.items[index]?.quantity?.message!)}</FieldError>
                                                )}
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.price") || "Price"}</FieldLabel>
                                            <FieldContent>
                                                <NumericInput {...register(`items.${index}.price`)} />
                                                {errors.items?.[index]?.price && (
                                                    <FieldError>{t(errors.items[index]?.price?.message!)}</FieldError>
                                                )}
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.discount_percent") || "Discount %"}</FieldLabel>
                                            <FieldContent>
                                                <NumericInput {...register(`items.${index}.discount_percent`)} />
                                            </FieldContent>
                                        </Field>

                                        <Field>
                                            <FieldLabel>{t("attributes.tax_rate") || "Tax Rate"}</FieldLabel>
                                            <FieldContent>
                                                <SelectEntity control={control} name={`items.${index}.tax_rate_id`} options={taxRates} loading={optionsLoading} />
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

                        <FieldSeparator />

                        <LineItemsTotals control={control} taxRates={taxRates} currencies={currencies} />
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

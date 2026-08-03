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
import { Textarea } from "@/components/ui/textarea";
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
    getInventoryAdjustment,
    createInventoryAdjustment,
    updateInventoryAdjustment,
    InventoryAdjustmentFormData,
    InventoryAdjustmentStatus,
} from "@/actions/finance/inventory-adjustment.actions";
import { getWarehouses } from "@/actions/finance/warehouse.actions";
import { getItems } from "@/actions/finance/item.actions";
import { getAccounts } from "@/actions/finance/account.actions";

const inventoryAdjustmentSchema = z.object({
    status: z.enum(["DRAFT", "APPROVED"]),
    reference: z.string().optional(),
    date: z.string().min(1, { message: "validation.required" }),
    warehouse_id: z.union([z.string(), z.number()]).refine((v) => !!v, { message: "validation.required" }),
    item_id: z.union([z.string(), z.number()]).refine((v) => !!v, { message: "validation.required" }),
    line_item_description: z.string().optional(),
    qty: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null, { message: "validation.required" }),
    inventory_value: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== null, { message: "validation.required" }),
    account_id: z.union([z.string(), z.number()]).optional().nullable(),
    total_adjustment_amount: z.union([z.string(), z.number()]).optional(),
});

type InventoryAdjustmentFormValues = z.infer<typeof inventoryAdjustmentSchema>;

export default function InventoryAdjustmentForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const adjustmentId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!adjustmentId);

    const [warehouses, setWarehouses] = useState<EntityOption[]>([]);
    const [items, setItems] = useState<EntityOption[]>([]);
    const [accounts, setAccounts] = useState<EntityOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

    const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<InventoryAdjustmentFormValues>({
        resolver: zodResolver(inventoryAdjustmentSchema),
        defaultValues: {
            status: "DRAFT",
            reference: "",
            date: "",
            warehouse_id: "",
            item_id: "",
            line_item_description: "",
            qty: 0,
            inventory_value: 0,
            account_id: null,
            total_adjustment_amount: 0,
        },
    });

    useEffect(() => {
        const loadOptions = async () => {
            setOptionsLoading(true);
            const [warehousesRes, itemsRes, accountsRes] = await Promise.all([
                getWarehouses({ limit: 1000 }),
                getItems({ limit: 1000 }),
                getAccounts(),
            ]);

            if (warehousesRes.success) {
                setWarehouses(warehousesRes.data.data.map((w) => ({ id: w.id, label: w.name })));
            }
            if (itemsRes.success) {
                setItems(itemsRes.data.data.map((i) => ({ id: i.id, label: i.name_localized || i.name?.en || i.name?.ar })));
            }
            if (accountsRes.success) {
                setAccounts(accountsRes.data.map((a) => ({ id: a.id, label: `${a.account_code} - ${a.name_localized || a.name?.en}` })));
            }
            setOptionsLoading(false);
        };
        loadOptions();
    }, []);

    useEffect(() => {
        if (!adjustmentId) return;
        const loadAdjustment = async () => {
            const res = await getInventoryAdjustment(adjustmentId);
            if (res.success) {
                const a = res.data;
                setValue("status", (a.status as InventoryAdjustmentStatus) || "DRAFT");
                setValue("reference", a.reference || "");
                setValue("date", a.date?.slice(0, 10) || "");
                setValue("warehouse_id", String(a.warehouse_id));
                setValue("item_id", String(a.item_id));
                setValue("line_item_description", a.line_item_description || "");
                setValue("qty", a.qty);
                setValue("inventory_value", a.inventory_value);
                setValue("account_id", a.account_id ? String(a.account_id) : null);
                setValue("total_adjustment_amount", a.total_adjustment_amount || 0);
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadAdjustment();
    }, [adjustmentId, setValue]);

    const onSubmit = (values: InventoryAdjustmentFormValues) => {
        startTransition(async () => {
            const payload: InventoryAdjustmentFormData = {
                ...values,
                account_id: values.account_id || null,
            };

            const res = adjustmentId
                ? await updateInventoryAdjustment(adjustmentId, payload)
                : await createInventoryAdjustment(payload);

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
                            {adjustmentId
                                ? t("attributes.edit_inventory_adjustment") || "Edit Inventory Adjustment"
                                : t("attributes.create_inventory_adjustment") || "Create Inventory Adjustment"}
                        </CardTitle>
                        <CardDescription>{t("routes.finance") || "Finance"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
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
                                                        {(["DRAFT", "APPROVED"] as InventoryAdjustmentStatus[]).map((s) => (
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
                                    <FieldLabel>{t("attributes.warehouse") || "Warehouse"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity control={control} name="warehouse_id" options={warehouses} loading={optionsLoading} />
                                        {errors.warehouse_id && <FieldError>{t(errors.warehouse_id.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.item") || "Item"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity control={control} name="item_id" options={items} loading={optionsLoading} />
                                        {errors.item_id && <FieldError>{t(errors.item_id.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.quantity") || "Quantity"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("qty", { valueAsNumber: true })} />
                                        {errors.qty && <FieldError>{t(errors.qty.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.inventory_value") || "Inventory Value"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("inventory_value", { valueAsNumber: true })} />
                                        {errors.inventory_value && <FieldError>{t(errors.inventory_value.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.account") || "Account"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity control={control} name="account_id" options={accounts} loading={optionsLoading} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.total_adjustment_amount") || "Total Adjustment Amount"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("total_adjustment_amount", { valueAsNumber: true })} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.reference") || "Reference"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("reference")} />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>

                            <Field>
                                <FieldLabel>{t("attributes.description") || "Description"}</FieldLabel>
                                <FieldContent>
                                    <Textarea {...register("line_item_description")} rows={3} />
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

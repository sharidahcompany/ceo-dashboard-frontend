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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldSet,
} from "@/components/ui/field";
import { SelectEntity, EntityOption } from "@/components/ui/select-entity";
import { FileUpload } from "@/components/ui/file-upload";

import {
    getItem,
    createItem,
    updateItem,
} from "@/actions/finance/item.actions";
import { getAccounts } from "@/actions/finance/account.actions";
import { getWarehouses } from "@/actions/finance/warehouse.actions";

const itemSchema = z.object({
    sku: z.string().optional(),
    image: z.any().optional().nullable(),
    name: z.object({
        ar: z.string().min(1, { message: "validation.required" }),
        en: z.string().min(1, { message: "validation.required" }),
    }),
    description: z.object({
        ar: z.string().optional(),
        en: z.string().optional(),
    }).optional(),
    unit_cost: z.union([z.string(), z.number()]).optional(),
    unit_price: z.union([z.string(), z.number()]).optional(),
    expense_account: z.union([z.string(), z.number()]).optional().nullable(),
    revenue_account: z.union([z.string(), z.number()]).optional().nullable(),
    quantity: z.union([z.string(), z.number()]).optional(),
    avg_unit_cost: z.union([z.string(), z.number()]).optional(),
    inventory_value: z.union([z.string(), z.number()]).optional(),
    measurement_unit: z.string().optional(),
    warehouse_id: z.union([z.string(), z.number()]).optional().nullable(),
    show_on_site: z.boolean().optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export default function ItemForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const itemId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!itemId);

    const [accounts, setAccounts] = useState<EntityOption[]>([]);
    const [warehouses, setWarehouses] = useState<EntityOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<ItemFormValues>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            sku: "",
            image: null,
            name: { ar: "", en: "" },
            description: { ar: "", en: "" },
            unit_cost: "",
            unit_price: "",
            expense_account: null,
            revenue_account: null,
            quantity: "",
            avg_unit_cost: "",
            inventory_value: "",
            measurement_unit: "",
            warehouse_id: null,
            show_on_site: false,
        },
    });

    useEffect(() => {
        const loadOptions = async () => {
            setOptionsLoading(true);
            const [accountsRes, warehousesRes] = await Promise.all([
                getAccounts(),
                getWarehouses({ limit: 1000 }),
            ]);

            if (accountsRes.success) {
                setAccounts(
                    accountsRes.data.map((a) => ({
                        id: a.id,
                        label: `${a.account_code} - ${a.name_localized || a.name?.en}`,
                    }))
                );
            }
            if (warehousesRes.success) {
                setWarehouses(warehousesRes.data.data.map((w) => ({ id: w.id, label: w.name })));
            }
            setOptionsLoading(false);
        };
        loadOptions();
    }, []);

    useEffect(() => {
        if (!itemId) return;
        const loadItem = async () => {
            const res = await getItem(itemId);
            if (res.success) {
                const i = res.data;
                setValue("sku", i.sku || "");
                setValue("name", { ar: i.name?.ar || "", en: i.name?.en || "" });
                setValue("description", { ar: i.description?.ar || "", en: i.description?.en || "" });
                setValue("unit_cost", i.unit_cost ?? "");
                setValue("unit_price", i.unit_price ?? "");
                setValue("expense_account", i.expense_account_id ? String(i.expense_account_id) : null);
                setValue("revenue_account", i.revenue_account_id ? String(i.revenue_account_id) : null);
                setValue("quantity", i.quantity ?? "");
                setValue("avg_unit_cost", i.avg_unit_cost ?? "");
                setValue("inventory_value", i.inventory_value ?? "");
                setValue("measurement_unit", i.measurement_unit || "");
                setValue("warehouse_id", i.warehouse_id ? String(i.warehouse_id) : null);
                if (i.image) {
                    setImagePreview(i.image);
                    setValue("image", i.image);
                }
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadItem();
    }, [itemId, setValue]);

    const onSubmit = (values: ItemFormValues) => {
        startTransition(async () => {
            const formData = new FormData();
            if (values.sku) formData.append("sku", values.sku);
            formData.append("name[ar]", values.name.ar);
            formData.append("name[en]", values.name.en);
            if (values.description?.ar) formData.append("description[ar]", values.description.ar);
            if (values.description?.en) formData.append("description[en]", values.description.en);
            if (values.unit_cost !== "" && values.unit_cost !== undefined) formData.append("unit_cost", String(values.unit_cost));
            if (values.unit_price !== "" && values.unit_price !== undefined) formData.append("unit_price", String(values.unit_price));
            if (values.expense_account) formData.append("expense_account", String(values.expense_account));
            if (values.revenue_account) formData.append("revenue_account", String(values.revenue_account));
            if (values.quantity !== "" && values.quantity !== undefined) formData.append("quantity", String(values.quantity));
            if (values.avg_unit_cost !== "" && values.avg_unit_cost !== undefined) formData.append("avg_unit_cost", String(values.avg_unit_cost));
            if (values.inventory_value !== "" && values.inventory_value !== undefined) formData.append("inventory_value", String(values.inventory_value));
            if (values.measurement_unit) formData.append("measurement_unit", values.measurement_unit);
            if (values.warehouse_id) formData.append("warehouse_id", String(values.warehouse_id));
            formData.append("show_on_site", values.show_on_site ? "1" : "0");

            if (values.image && values.image instanceof File) {
                formData.append("image", values.image);
            }

            const res = itemId
                ? await updateItem(itemId, formData)
                : await createItem(formData);

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
                            {itemId ? t("attributes.edit_item") || "Edit Item" : t("attributes.create_item") || "Create Item"}
                        </CardTitle>
                        <CardDescription>{t("routes.finance") || "Finance"}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                <Field>
                                    <FieldLabel>{t("attributes.name_en") || "Name (English)"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("name.en")} placeholder={t("attributes.name_en") || "Name (English)"} />
                                        {errors.name?.en && <FieldError>{t(errors.name.en.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.name_ar") || "Name (Arabic)"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("name.ar")} placeholder={t("attributes.name_ar") || "Name (Arabic)"} dir="rtl" className="text-right" />
                                        {errors.name?.ar && <FieldError>{t(errors.name.ar.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.sku") || "SKU"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("sku")} placeholder={t("attributes.sku") || "SKU"} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.measurement_unit") || "Measurement Unit"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("measurement_unit")} placeholder={t("attributes.measurement_unit") || "Measurement Unit"} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.unit_cost") || "Unit Cost"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("unit_cost")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.unit_price") || "Unit Price"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("unit_price")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.quantity") || "Quantity"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("quantity")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.avg_unit_cost") || "Average Unit Cost"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("avg_unit_cost")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.inventory_value") || "Inventory Value"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="number" step="any" {...register("inventory_value")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.expense_account") || "Expense Account"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="expense_account"
                                            options={accounts}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_account") || "Select account"}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.revenue_account") || "Revenue Account"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="revenue_account"
                                            options={accounts}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_account") || "Select account"}
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

                                <Field orientation="horizontal">
                                    <Controller
                                        name="show_on_site"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                checked={!!field.value}
                                                onCheckedChange={(checked) => field.onChange(!!checked)}
                                                className="border-input data-checked:bg-primary"
                                            />
                                        )}
                                    />
                                    <FieldLabel className="font-normal">
                                        {t("attributes.show_on_site") || "Show on Site"}
                                    </FieldLabel>
                                </Field>
                            </FieldGroup>

                            <Field>
                                <FieldLabel>{t("attributes.description_en") || "Description (English)"}</FieldLabel>
                                <FieldContent>
                                    <Textarea {...register("description.en")} rows={3} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>{t("attributes.description_ar") || "Description (Arabic)"}</FieldLabel>
                                <FieldContent>
                                    <Textarea {...register("description.ar")} rows={3} dir="rtl" className="text-right" />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>{t("attributes.image") || "Image"}</FieldLabel>
                                <FieldContent>
                                    <FileUpload name="image" control={control} initialUrl={imagePreview} />
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

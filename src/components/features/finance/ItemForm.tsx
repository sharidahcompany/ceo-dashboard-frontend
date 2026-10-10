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
import { previewCatalogImport, planCatalogImport, type CatalogImportPreview, type CatalogImportPlan } from "@/actions/finance/catalog-import.actions";
import { getCatalogCategories, type CatalogCategoryOption } from "@/actions/finance/catalog-category.actions";
import { getFinanceLegalEntities, type FinanceLegalEntity } from "@/actions/finance/legal-entity.actions";

const itemSchema = z.object({
    legal_entity_id: z.string().min(1, "اختر الكيان القانوني"),
    catalog_type: z.enum(["physical","service","digital","supply","asset","bundle"]),
    catalog_category_ids: z.array(z.number().int().positive()),
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
    unit_cost: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== undefined && v !== null, { message: "validation.required" }),
    unit_price: z.union([z.string(), z.number()]).refine((v) => v !== "" && v !== undefined && v !== null, { message: "validation.required" }),
    expense_account: z.union([z.string(), z.number()]).optional().nullable(),
    revenue_account: z.union([z.string(), z.number()]).optional().nullable(),
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

    const [legalEntities, setLegalEntities] = useState<FinanceLegalEntity[]>([]);
    const [categories, setCategories] = useState<CatalogCategoryOption[]>([]);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [categoriesReady, setCategoriesReady] = useState(false);
    const [accounts, setAccounts] = useState<EntityOption[]>([]);
    const [warehouses, setWarehouses] = useState<EntityOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<CatalogImportPreview | null>(null);
    // CEO_CATALOG_IMPORT_PLANNING_UI_20261009
    const [importPlan, setImportPlan] = useState<CatalogImportPlan | null>(null);
    // CEO_CATALOG_IMPORT_STALE_PLAN_GUARD_20261009
    const [plannedInputs, setPlannedInputs] = useState<{
        file: File;
        legalEntityId: string;
        mode: "create" | "update";
    } | null>(null);
    const [importMode, setImportMode] = useState<"create" | "update">("create");
    const [planningLoading, setPlanningLoading] = useState(false);
    const [planningError, setPlanningError] = useState<string | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        watch,
        getValues,
        formState: { errors },
    } = useForm<ItemFormValues>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            legal_entity_id: "",
            catalog_type: "physical",
            catalog_category_ids: [],
            sku: "",
            image: null,
            name: { ar: "", en: "" },
            description: { ar: "", en: "" },
            unit_cost: "",
            unit_price: "",
            expense_account: null,
            revenue_account: null,
            measurement_unit: "",
            warehouse_id: null,
            show_on_site: false,
        },
    });

    useEffect(() => {
        const loadOptions = async () => {
            setOptionsLoading(true);
            const [accountsRes, warehousesRes, entitiesRes] = await Promise.all([
                getAccounts(),
                getWarehouses({ limit: 1000 }),
                getFinanceLegalEntities(),
            ]);

            if (entitiesRes.success) {
                setLegalEntities(entitiesRes.data);
            } else {
                toast.error(entitiesRes.error);
            }

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
                setValue("legal_entity_id", String(i.legal_entity_id ?? ""));
                setValue("catalog_type", i.catalog_type || "physical");
                setValue("catalog_category_ids", i.catalog_category_ids || []);
            setValue("sku", i.sku || "");
                setValue("name", { ar: i.name?.ar || "", en: i.name?.en || "" });
                setValue("description", { ar: i.description?.ar || "", en: i.description?.en || "" });
                setValue("unit_cost", i.unit_cost ?? "");
                setValue("unit_price", i.unit_price ?? "");
                setValue("expense_account", i.expense_account_id ? String(i.expense_account_id) : null);
                setValue("revenue_account", i.revenue_account_id ? String(i.revenue_account_id) : null);
                setValue("measurement_unit", i.measurement_unit || "");
                setValue("warehouse_id", i.warehouse_id ? String(i.warehouse_id) : null);
                setValue("show_on_site", !!i.show_on_site);
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


    // CEO_CATALOG_CATEGORY_FORM_20261009
    const selectedLegalEntityId = watch("legal_entity_id");
    const selectedCategoryIds = watch("catalog_category_ids") || [];

    useEffect(() => {
        let active = true;

        setCategories([]);
        setCategoriesReady(false);
        setCategoryError(null);

        if (!selectedLegalEntityId) {
            return () => { active = false; };
        }

        getCatalogCategories(selectedLegalEntityId).then((res) => {
            if (!active) return;

            if (res.success) {
                setCategories(res.data);
                setCategoriesReady(true);
            } else {
                setCategoryError(
                    res.error || "تعذر تحميل التصنيفات. لم يكتمل تفويض الكتالوج."
                );
            }
        });

        return () => { active = false; };
    }, [selectedLegalEntityId]);

    const toggleCatalogCategory = (id: number, checked: boolean) => {
        const current = getValues("catalog_category_ids") || [];
        setValue(
            "catalog_category_ids",
            checked
                ? Array.from(new Set([...current, id]))
                : current.filter((value) => value !== id),
            { shouldDirty: true, shouldValidate: true }
        );
    };


    // CEO_CATALOG_IMPORT_PREVIEW_UI_20261009

    // CEO_CATALOG_IMPORT_ERROR_REPORT_20261009
    const downloadImportErrors = () => {
        if (!importPreview || importPreview.errors.length === 0) return;

        const escapeCsv = (value: string | number) =>
            `"${String(value).replace(/"/g, '""')}"`;

        const rows = [
            ["row", "error"],
            ...importPreview.errors.flatMap((entry) =>
                entry.messages.map((message) => [
                    String(entry.row),
                    message,
                ])
            ),
        ];

        const csv = "\uFEFF" + rows
            .map((row) => row.map(escapeCsv).join(","))
            .join("\r\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "catalog-import-errors.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    // CEO_CATALOG_IMPORT_PLANNING_UI_20261009
    const handleImportPlanning = async () => {
        if (!importFile || planningLoading || importLoading) return;

        const legalEntityId = getValues("legal_entity_id");

        if (!legalEntityId) {
            setPlanningError("اختر الكيان القانوني أولًا.");
            return;
        }

        setPlanningLoading(true);
        setPlanningError(null);
        setImportPlan(null);
        setPlannedInputs(null);

        try {
            const payload = new FormData();
            payload.append("file", importFile);
            payload.append("legal_entity_id", String(legalEntityId));
            payload.append("mode", importMode);

            const result = await planCatalogImport(payload);

            if (result.success) {
                setImportPlan(result.data);
                setPlannedInputs({
                    file: importFile,
                    legalEntityId: String(legalEntityId),
                    mode: importMode,
                });
            } else {
                setPlanningError(result.error || "تعذر تخطيط الاستيراد.");
            }
        } finally {
            setPlanningLoading(false);
        }
    };

    const handleImportPreview = async () => {
        if (!importFile || importLoading) return;

        setImportLoading(true);
        setImportError(null);
        setImportPreview(null);

        try {
            const payload = new FormData();
            payload.append("file", importFile);

            const result = await previewCatalogImport(payload);

            if (result.success) {
                setImportPreview(result.data);
            } else {
                setImportError(result.error || "تعذرت معاينة الملف.");
            }
        } finally {
            setImportLoading(false);
        }
    };

    const onSubmit = (values: ItemFormValues) => {
        // CEO_CATALOG_NONBLOCKING_CATEGORY_20261009
        // Preserve ordinary item edits when category API is unavailable.
        // Never submit category changes without a successfully loaded list.
        if (!categoriesReady && values.catalog_category_ids.length > 0) {
            toast.error("لا يمكن تعديل التصنيفات قبل اكتمال صلاحيات الكتالوج.");
            return;
        }
        startTransition(async () => {
            const formData = new FormData();
            formData.append("legal_entity_id", values.legal_entity_id);
            formData.append("catalog_type", values.catalog_type);
            if (categoriesReady && values.catalog_category_ids.length > 0) {
                values.catalog_category_ids.forEach((id, index) => {
                    formData.append(`catalog_category_ids[${index}]`, String(id));
                });
            }
            if (values.sku) formData.append("sku", values.sku);
            formData.append("name[ar]", values.name.ar);
            formData.append("name[en]", values.name.en);
            if (values.description?.ar) formData.append("description[ar]", values.description.ar);
            if (values.description?.en) formData.append("description[en]", values.description.en);
            if (values.unit_cost !== "" && values.unit_cost !== undefined) formData.append("unit_cost", String(values.unit_cost));
            if (values.unit_price !== "" && values.unit_price !== undefined) formData.append("unit_price", String(values.unit_price));
            if (values.expense_account) formData.append("expense_account", String(values.expense_account));
            if (values.revenue_account) formData.append("revenue_account", String(values.revenue_account));
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
                                {/* CEO_CATALOG_FORM_STOCK_READONLY_20261009 */}
                                <div className="md:col-span-2 rounded-md border p-3 text-sm text-muted-foreground">
                                    أرصدة المخزون والكميات ومتوسط التكلفة تُدار من خلال
                                    المستودعات والحركات المخزنية، وليست من شاشة تعريف الصنف.
                                </div>


                                {/* CEO_CATALOG_LEGAL_ENTITY_FORM_20261009 */}
                                <Field>
                                    <FieldLabel>الكيان القانوني *</FieldLabel>
                                    <FieldContent>
                                        {/* CEO_CATALOG_ENTITY_EDIT_FIX_20261009 */}
                                        {itemId && (
                                            <input
                                                type="hidden"
                                                {...register("legal_entity_id")}
                                            />
                                        )}
                                        <select
                                            {...(!itemId ? register("legal_entity_id") : {})}
                                            value={itemId ? watch("legal_entity_id") : undefined}
                                            disabled={!!itemId || optionsLoading}
                                            className="w-full rounded-md border px-3 py-2"
                                            aria-label="الكيان القانوني"
                                        >
                                            <option value="">اختر الكيان القانوني</option>
                                            {legalEntities.map((entity) => {
                                                const rawName =
                                                    entity.legal_name ?? entity.name;
                                                const label = typeof rawName === "string"
                                                    ? rawName
                                                    : rawName?.ar ?? rawName?.en ??
                                                      entity.code ?? String(entity.id);

                                                return (
                                                    <option key={entity.id} value={String(entity.id)}>
                                                        {label}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        {errors.legal_entity_id && (
                                            <span className="text-sm text-destructive">
                                                {errors.legal_entity_id.message}
                                            </span>
                                        )}
                                    </FieldContent>
                                </Field>


                                <div className="md:col-span-2 space-y-2 rounded-md border p-4">
                                    <div className="font-medium">تصنيفات المنتج أو الخدمة</div>
                                    <div className="text-sm text-muted-foreground">
                                        اختر تصنيفًا أو أكثر تابعًا للكيان القانوني المحدد.
                                    </div>

                                    {categoryError && (
                                        <p role="alert" className="text-sm text-destructive">
                                            {categoryError}
                                        </p>
                                    )}

                                    {!selectedLegalEntityId && (
                                        <p className="text-sm text-muted-foreground">
                                            اختر الكيان القانوني أولًا.
                                        </p>
                                    )}

                                    {categoriesReady && categories.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            لا توجد تصنيفات متاحة لهذا الكيان.
                                        </p>
                                    )}

                                    {categories.map((category) => {
                                        const name = category.name;
                                        const label = typeof name === "string"
                                            ? name
                                            : name?.ar || name?.en || category.code ||
                                              String(category.id);

                                        return (
                                            <label
                                                key={category.id}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategoryIds.includes(category.id)}
                                                    onChange={(event) =>
                                                        toggleCatalogCategory(
                                                            category.id,
                                                            event.target.checked
                                                        )
                                                    }
                                                />
                                                <span>{label}</span>
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* CEO_CATALOG_TYPES_UI_20261009 */}
                                <Field>
                                    <FieldLabel>نوع المنتج أو الخدمة</FieldLabel>
                                    <FieldContent>
                                        <select {...register("catalog_type")} className="w-full rounded-md border px-3 py-2">
                                                <option value="physical">منتج مادي — سلع وأجهزة وأدوية ومواد يمكن بيعها أو شراؤها وتخزينها.</option>
                                                <option value="service">خدمة — عمل تقدمه المنشأة مثل الكشف الطبي أو النقل أو الصيانة.</option>
                                                <option value="digital">منتج رقمي — برنامج أو ملف أو ترخيص يُسلّم إلكترونيًا.</option>
                                                <option value="supply">مستلزم — مواد تُستهلك في الأعمال والمشاريع وتقديم الخدمات.</option>
                                                <option value="asset">معدة أو أصل — معدات وأجهزة ومركبات تُستخدم أو تؤجر أو تُدار كأصول.</option>
                                                <option value="bundle">باقة — مجموعة منتجات أو خدمات تقدم معًا بسعر أو شروط محددة.</option>
                                        </select>
                                    </FieldContent>
                                </Field>

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
                                    <FieldLabel>{t("attributes.unit_cost") || "Unit Cost"} *</FieldLabel>
                                    <FieldContent>
                                        <NumericInput {...register("unit_cost")} />
                                        {errors.unit_cost && <FieldError>{t(errors.unit_cost.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.unit_price") || "Unit Price"} *</FieldLabel>
                                    <FieldContent>
                                        <NumericInput {...register("unit_price")} />
                                        {errors.unit_price && <FieldError>{t(errors.unit_price.message!)}</FieldError>}
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

                                {/* CEO_CATALOG_ADAPTIVE_WAREHOUSE_20261009 */}
                                {(["physical", "supply", "asset"].includes(watch("catalog_type"))) && (
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
                                )}

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



                <div className="space-y-3 rounded-lg border p-4">
                    <div className="font-medium">
                        معاينة ملف Excel قبل الاستيراد
                    </div>
                    <p className="text-sm text-muted-foreground">
                        هذه العملية للتحقق من الملف فقط؛ لن تُنشئ أصنافًا
                        ولن تغيّر أي بيانات في قاعدة البيانات.
                    </p>

                    <input
                        type="file"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        aria-label="اختر ملف Excel"
                        onChange={(event) => {
                            setImportFile(event.target.files?.[0] ?? null);
                                            setImportPlan(null);
                                            setPlannedInputs(null);
                                            setPlanningError(null);
                            setImportPreview(null);
                            setImportError(null);
                        }}
                    />

                    <button
                        type="button"
                        disabled={!importFile || importLoading}
                        onClick={handleImportPreview}
                        className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
                    >
                        {importLoading ? "جاري فحص الملف..." : "معاينة الملف"}
                    </button>

                    {importError && (
                        <p role="alert" className="text-sm text-destructive">
                            {importError}
                        </p>
                    )}

                    {/* CEO_CATALOG_IMPORT_PLANNING_UI_20261009 */}
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            aria-label="وضع استيراد الأصناف"
                            value={importMode}
                            onChange={(event) => {
                                setImportMode(event.target.value as "create" | "update");
                                setImportPlan(null);
                                setPlanningError(null);
                            }}
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                        >
                            <option value="create">إضافة أصناف جديدة</option>
                            <option value="update">تحديث أصناف موجودة</option>
                        </select>
                        <button
                            type="button"
                            disabled={!importFile || planningLoading || importLoading}
                            onClick={handleImportPlanning}
                            className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
                        >
                            {planningLoading ? "جاري تحليل التعارضات..." : "فحص التعارضات وتخطيط الاستيراد"}
                        </button>
                    </div>

                    {planningError && (
                        <p role="alert" className="text-sm text-destructive">
                            {planningError}
                        </p>
                    )}

                    {importPlan &&
                        plannedInputs?.file === importFile &&
                        plannedInputs?.legalEntityId === String(watch("legal_entity_id")) &&
                        plannedInputs?.mode === importMode && (
                        <div className="space-y-2 rounded-md border p-3 text-sm">
                            <p className="font-medium">خطة الاستيراد — دون تعديل البيانات</p>
                            <p>إجمالي الصفوف: {importPlan.total_rows}</p>
                            <p>إضافة: {importPlan.counts.create}</p>
                            <p>تحديث: {importPlan.counts.update}</p>
                            <p>تعارضات: {importPlan.counts.conflict}</p>
                            {importPlan.has_conflicts && (
                                <p className="text-destructive">
                                    توجد تعارضات يجب معالجتها قبل التنفيذ.
                                </p>
                            )}
                            <details>
                                <summary className="cursor-pointer">
                                    عرض قرارات الصفوف
                                </summary>
                                <div className="mt-2 max-h-64 overflow-auto">
                                    {importPlan.rows.map((entry) => (
                                        <p key={entry.row}>
                                            صف {entry.row} — {entry.sku} — {entry.action}
                                            {entry.reason ? ` — ${entry.reason}` : ""}
                                        </p>
                                    ))}
                                </div>
                            </details>
                            <p className="text-muted-foreground">
                                تنفيذ الاستيراد غير مفعّل حتى اكتمال اعتماد الخادم.
                            </p>
                        </div>
                    )}

                    {importPreview && (
                        <div className="space-y-3">
                            <p className="font-medium">
                                إجمالي الصفوف: {importPreview.total_rows}
                            </p>
                            <p className="text-sm">
                                الصفوف التي تحتوي على أخطاء:
                                {importPreview.error_row_count}
                                {importPreview.error_report_truncated
                                    ? " — التقرير مختصر"
                                    : ""}
                            </p>

                            {importPreview.errors.length > 0 && (
                                <button
                                    type="button"
                                    onClick={downloadImportErrors}
                                    className="rounded-md border px-4 py-2 text-sm"
                                >
                                    تنزيل تقرير الأخطاء CSV
                                </button>
                            )}
                            {importPreview.error_report_truncated && (
                                <p className="text-sm text-muted-foreground">
                                    يحتوي التقرير القابل للتنزيل على الأخطاء
                                    التي أعادتها المعاينة فقط (حتى 200 صف).
                                    سنضيف التقرير الكامل في محرك الاستيراد.
                                </p>
                            )}

                            <div className="max-h-64 overflow-auto rounded-md border p-3">
                                {importPreview.errors.map((error, index) => (
                                    <p key={index} className="mb-2 text-sm text-destructive">
                                        الصف {error.row}: {error.messages.join("، ")}
                                    </p>
                                ))}
                                {importPreview.errors.length === 0 && (
                                    <p className="text-sm">
                                        لم تُكتشف أخطاء في القيم التي فحصها المحرك.
                                        لم تُفحص تكرارات قاعدة البيانات بعد.
                                    </p>
                                )}
                            </div>

                            <details>
                                <summary className="cursor-pointer text-sm font-medium">
                                    عرض أول {importPreview.preview.length} صفًا
                                </summary>
                                <div className="mt-2 max-h-80 overflow-auto text-xs">
                                    <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(importPreview.preview, null, 2)}
                                    </pre>
                                </div>
                            </details>

                            <p className="text-xs text-muted-foreground">
                                المعاينة لا تعني اعتماد الملف للاستيراد.
                                يجب اجتياز التحقق من الصلاحيات والتكرارات أولًا.
                            </p>
                        </div>
                    )}
                </div>

                {/* CEO_CATALOG_EXCEL_TEMPLATE_LINK_20261009 */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                    <div>
                        <p className="font-medium">استيراد المنتجات والخدمات من Excel</p>
                        <p className="text-sm text-muted-foreground">
                            حمّل القالب المعتمد لتجهيز الأصناف قبل الاستيراد الجماعي.
                        </p>
                    </div>
                    <a
                        href="/templates/enterprise-catalog-import.xlsx"
                        download="enterprise-catalog-import.xlsx"
                        className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                        تنزيل قالب Excel
                    </a>
                </div>

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

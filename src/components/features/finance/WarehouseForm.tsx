"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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
import { SelectEntity, EntityOption } from "@/components/ui/select-entity";

import {
    getWarehouse,
    createWarehouse,
    updateWarehouse,
    WarehouseFormData,
} from "@/actions/finance/warehouse.actions";
import { getAccounts } from "@/actions/finance/account.actions";

const warehouseSchema = z.object({
    name: z.string().min(1, { message: "validation.required" }),
    phone: z.string().optional(),
    email: z.string().optional(),
    building_number: z.string().optional(),
    street: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    account_id: z.union([z.string(), z.number()]).refine((v) => !!v, {
        message: "validation.required",
    }),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export default function WarehouseForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const warehouseId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!warehouseId);

    const [accounts, setAccounts] = useState<EntityOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<WarehouseFormValues>({
        resolver: zodResolver(warehouseSchema),
        defaultValues: {
            name: "",
            phone: "",
            email: "",
            building_number: "",
            street: "",
            district: "",
            city: "",
            postal_code: "",
            account_id: "",
        },
    });

    useEffect(() => {
        const loadOptions = async () => {
            setOptionsLoading(true);
            const accountsRes = await getAccounts();
            if (accountsRes.success) {
                setAccounts(
                    accountsRes.data.map((a) => ({ id: a.id, label: `${a.account_code} - ${a.name_localized || a.name?.en}` }))
                );
            }
            setOptionsLoading(false);
        };
        loadOptions();
    }, []);

    useEffect(() => {
        if (!warehouseId) return;
        const loadWarehouse = async () => {
            const res = await getWarehouse(warehouseId);
            if (res.success) {
                const w = res.data;
                setValue("name", w.name || "");
                setValue("phone", w.phone || "");
                setValue("email", w.email || "");
                setValue("building_number", w.building_number || "");
                setValue("street", w.street || "");
                setValue("district", w.district || "");
                setValue("city", w.city || "");
                setValue("postal_code", w.postal_code || "");
                setValue("account_id", w.account_id ? String(w.account_id) : "");
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadWarehouse();
    }, [warehouseId, setValue]);

    const onSubmit = (values: WarehouseFormValues) => {
        startTransition(async () => {
            const payload: WarehouseFormData = { ...values };

            const res = warehouseId
                ? await updateWarehouse(warehouseId, payload)
                : await createWarehouse(payload);

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
                            {warehouseId ? t("attributes.edit_warehouse") || "Edit Warehouse" : t("attributes.create_warehouse") || "Create Warehouse"}
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
                                    <FieldLabel>{t("attributes.account") || "Account"}</FieldLabel>
                                    <FieldContent>
                                        <SelectEntity
                                            control={control}
                                            name="account_id"
                                            options={accounts}
                                            loading={optionsLoading}
                                            placeholder={t("actions.select_account") || "Select account"}
                                        />
                                        {errors.account_id && <FieldError>{t(errors.account_id.message!)}</FieldError>}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.phone") || "Phone"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("phone")} placeholder={t("attributes.phone") || "Phone"} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.email") || "Email"}</FieldLabel>
                                    <FieldContent>
                                        <Input type="email" {...register("email")} placeholder={t("attributes.email") || "Email"} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.building_number")}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("building_number")} placeholder={t("attributes.building_number")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.street")}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("street")} placeholder={t("attributes.street")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.district") || "District"}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("district")} placeholder={t("attributes.district") || "District"} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.city")}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("city")} placeholder={t("attributes.city")} />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.postal_code")}</FieldLabel>
                                    <FieldContent>
                                        <Input {...register("postal_code")} placeholder={t("attributes.postal_code")} />
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

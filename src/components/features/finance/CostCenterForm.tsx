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

import {
    getCostCenter,
    createCostCenter,
    updateCostCenter,
    CostCenterFormData,
} from "@/actions/finance/cost-center.actions";

const costCenterSchema = z.object({
    name: z.object({
        ar: z.string().min(1, { message: "validation.required" }),
        en: z.string().min(1, { message: "validation.required" }),
    }),
});

type CostCenterFormValues = z.infer<typeof costCenterSchema>;

export default function CostCenterForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const costCenterId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!costCenterId);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<CostCenterFormValues>({
        resolver: zodResolver(costCenterSchema),
        defaultValues: {
            name: { ar: "", en: "" },
        },
    });

    useEffect(() => {
        if (!costCenterId) return;
        const loadCostCenter = async () => {
            const res = await getCostCenter(costCenterId);
            if (res.success) {
                const cc = res.data;
                setValue("name", { ar: cc.name?.ar || "", en: cc.name?.en || "" });
            } else {
                toast.error(res.error);
            }
            setLoadingData(false);
        };
        loadCostCenter();
    }, [costCenterId, setValue]);

    const onSubmit = (values: CostCenterFormValues) => {
        startTransition(async () => {
            const payload: CostCenterFormData = { ...values };

            const res = costCenterId
                ? await updateCostCenter(costCenterId, payload)
                : await createCostCenter(payload);

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
                            {costCenterId ? t("attributes.edit_cost_center") || "Edit Cost Center" : t("attributes.create_cost_center") || "Create Cost Center"}
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

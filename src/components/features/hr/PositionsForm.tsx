"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, X, Save } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    getPosition,
    createPosition,
    updatePosition,
    getBenefits,
    createBenefit,
    BenefitResource
} from "@/actions/workspace/positions.actions";
import { DepartmentResource } from "@/actions/company-spirit/department.actions";
import { SelectDepartment } from "@/components/ui/select-department";
import { FileUpload } from "@/components/ui/file-upload";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldSet
} from "@/components/ui/field";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/utils";

interface PositionsFormValues {
    department_id: string;
    name_ar: string;
    name_en: string;
    description_ar: string;
    description_en: string;
    benefits: string[];
    status: string;
    cover: File | string | null;
}

export default function PositionsForm() {
    const t = useTranslations();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const positionId = (params?.id as string) || (searchParams?.get("id") as string) || undefined;

    const [isPending, startTransition] = useTransition();
    const [loadingData, setLoadingData] = useState(!!positionId);

    const [initialDept, setInitialDept] = useState<DepartmentResource | null>(null);
    const [benefitsList, setBenefitsList] = useState<BenefitResource[]>([]);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    // On the fly benefit creation state
    const [addBenefitOpen, setAddBenefitOpen] = useState(false);
    const [newBenefitNameEn, setNewBenefitNameEn] = useState("");
    const [newBenefitNameAr, setNewBenefitNameAr] = useState("");
    const [newBenefitDescEn, setNewBenefitDescEn] = useState("");
    const [newBenefitDescAr, setNewBenefitDescAr] = useState("");
    const [isCreatingBenefit, setIsCreatingBenefit] = useState(false);

    const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<PositionsFormValues>({
        defaultValues: {
            department_id: "",
            name_ar: "",
            name_en: "",
            description_ar: "",
            description_en: "",
            benefits: [],
            status: "active",
            cover: null
        }
    });

    const selectedBenefits = watch("benefits") || [];

    const loadBenefitsData = async () => {
        const benefitRes = await getBenefits();
        if (benefitRes.success && benefitRes.data) {
            setBenefitsList(benefitRes.data);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await loadBenefitsData();

            if (positionId) {
                const posRes = await getPosition(positionId);
                if (posRes.success) {
                    const pos = posRes.data;
                    setValue("department_id", pos.department?.id ? String(pos.department.id) : "");
                    setValue("name_ar", pos.name?.ar || "");
                    setValue("name_en", pos.name?.en || "");
                    setValue("description_ar", pos.description?.ar || "");
                    setValue("description_en", pos.description?.en || "");
                    setValue("status", pos.status || "active");
                    setValue("benefits", pos.benefits?.map(b => String(b.id)) || []);
                    if (pos.cover) {
                        setCoverPreview(pos.cover);
                        setValue("cover", pos.cover);
                    }
                    if (pos.department) {
                        setInitialDept({
                            id: pos.department.id,
                            name_localized: pos.department.name,
                            name: { ar: pos.department.name, en: pos.department.name },
                            branch_id: null,
                            parent_id: null,
                            manager_id: null
                        });
                    }
                } else {
                    toast.error(posRes.error);
                }
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [positionId, setValue]);

    const handleCreateBenefit = async () => {
        if (!newBenefitNameEn || !newBenefitNameAr || !newBenefitDescEn || !newBenefitDescAr) {
            toast.error(t("errors.something_went_wrong"));
            return;
        }

        setIsCreatingBenefit(true);
        const res = await createBenefit({
            name: { ar: newBenefitNameAr, en: newBenefitNameEn },
            description: { ar: newBenefitDescAr, en: newBenefitDescEn }
        });

        if (res.success) {
            toast.success(res.message || t("success"));
            setNewBenefitNameEn("");
            setNewBenefitNameAr("");
            setNewBenefitDescEn("");
            setNewBenefitDescAr("");
            setAddBenefitOpen(false);

            // Refresh list and auto select newly created benefit
            await loadBenefitsData();
            if (res.data) {
                setValue("benefits", [...selectedBenefits, String(res.data.id)]);
            }
        } else {
            toast.error(res.error);
        }
        setIsCreatingBenefit(false);
    };

    const onSubmit = (values: PositionsFormValues) => {
        startTransition(async () => {
            const formData = new FormData();
            if (values.department_id) {
                formData.append("department_id", values.department_id);
            }
            formData.append("name[ar]", values.name_ar);
            formData.append("name[en]", values.name_en);
            if (values.description_ar) {
                formData.append("description[ar]", values.description_ar);
            }
            if (values.description_en) {
                formData.append("description[en]", values.description_en);
            }
            formData.append("status", values.status);

            if (values.benefits && values.benefits.length > 0) {
                values.benefits.forEach((benefitId) => {
                    formData.append("benefits[]", benefitId);
                });
            }

            if (values.cover && values.cover instanceof File) {
                formData.append("cover", values.cover);
            }

            const res = positionId
                ? await updatePosition(positionId, formData)
                : await createPosition(formData);

            if (res.success) {
                toast.success(res.message || t("success"));
                router.push("/hr/positions");
            } else {
                toast.error(res.error);
            }
        });
    };

    const toggleBenefit = (idStr: string) => {
        const current = [...selectedBenefits];
        const idx = current.indexOf(idStr);
        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(idStr);
        }
        setValue("benefits", current);
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
                            {positionId ? t("routes.edit_position") : t("routes.create_position")}
                        </CardTitle>
                        <CardDescription>
                            {t("routes.positions")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                                {/* Department Selection */}
                                <Field>
                                    <FieldLabel>{t("actions.select_department")}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="department_id"
                                            control={control}
                                            rules={{ required: "validation.required" }}
                                            render={({ field }) => (
                                                <SelectDepartment
                                                    control={control}
                                                    name="department_id"
                                                    initialDepartment={initialDept}
                                                />
                                            )}
                                        />
                                        {errors.department_id && (
                                            <FieldError>{t(errors.department_id.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Status Select */}
                                <Field>
                                    <FieldLabel>{t("attributes.status")}</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue>
                                                            {field.value === "active" ? t("attributes.is_active") : t("plans.inactive_badge")}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">{t("attributes.is_active")}</SelectItem>
                                                        <SelectItem value="inactive">{t("plans.inactive_badge")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                </Field>

                                {/* Name Input Fields (Arabic & English) */}
                                <Field>
                                    <FieldLabel>{t("attributes.name_en")}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("name_en", { required: "validation.required" })}
                                            placeholder={t("attributes.name_en")}
                                        />
                                        {errors.name_en && (
                                            <FieldError>{t(errors.name_en.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.name_ar")}</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            {...register("name_ar", { required: "validation.required" })}
                                            placeholder={t("attributes.name_ar")}
                                            className="text-right"
                                            dir="rtl"
                                        />
                                        {errors.name_ar && (
                                            <FieldError>{t(errors.name_ar.message!)}</FieldError>
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Description Textareas (Arabic & English) */}
                                <Field>
                                    <FieldLabel>{t("attributes.description_en")}</FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            {...register("description_en")}
                                            placeholder={t("attributes.description_en")}
                                            rows={3}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{t("attributes.description_ar")}</FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            {...register("description_ar")}
                                            placeholder={t("attributes.description_ar")}
                                            rows={3}
                                        />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                {/* Benefits Checklist Card */}
                <Card className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <div>
                            <CardTitle>{t("sections.features")}</CardTitle>
                            <CardDescription>{t("routes.hr")}</CardDescription>
                        </div>

                        <Dialog open={addBenefitOpen} onOpenChange={setAddBenefitOpen}>
                            <DialogTrigger render={
                                <Button type="button" variant="outline" size="sm" className="gap-1">
                                    <Plus className="size-3.5" />
                                    {t("buttons.add") + " " + t("sections.features")}
                                </Button>
                            } />
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{t("buttons.add") + " " + t("sections.features")}</DialogTitle>
                                </DialogHeader>
                                <FieldSet>
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel>{t("attributes.name_en")}</FieldLabel>
                                            <FieldContent>
                                                <Input
                                                    value={newBenefitNameEn}
                                                    onChange={e => setNewBenefitNameEn(e.target.value)}
                                                    placeholder={t("attributes.name_en")}
                                                />
                                            </FieldContent>
                                        </Field>
                                        <Field>
                                            <FieldLabel>{t("attributes.name_ar")}</FieldLabel>
                                            <FieldContent>
                                                <Input
                                                    value={newBenefitNameAr}
                                                    onChange={e => setNewBenefitNameAr(e.target.value)}
                                                    placeholder={t("attributes.name_ar")}
                                                />
                                            </FieldContent>
                                        </Field>
                                        <Field>
                                            <FieldLabel>{t("attributes.description_en")}</FieldLabel>
                                            <FieldContent>
                                                <Textarea
                                                    value={newBenefitDescEn}
                                                    onChange={e => setNewBenefitDescEn(e.target.value)}
                                                    placeholder={t("attributes.description_en")}
                                                />
                                            </FieldContent>
                                        </Field>
                                        <Field>
                                            <FieldLabel>{t("attributes.description_ar")}</FieldLabel>
                                            <FieldContent>
                                                <Textarea
                                                    value={newBenefitDescAr}
                                                    onChange={e => setNewBenefitDescAr(e.target.value)}
                                                    placeholder={t("attributes.description_ar")}
                                                />
                                            </FieldContent>
                                        </Field>
                                    </FieldGroup>
                                </FieldSet>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setAddBenefitOpen(false)}>{t("buttons.cancel")}</Button>
                                    <Button type="button" onClick={handleCreateBenefit} disabled={isCreatingBenefit}>
                                        {isCreatingBenefit && <Loader2 className="mr-2 size-4 animate-spin" />}
                                        {t("buttons.save")}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {benefitsList.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t("datagrid.no_data")}</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {benefitsList.map((benefit) => {
                                    const isSelected = selectedBenefits.includes(String(benefit.id));
                                    return (
                                        <button
                                            key={benefit.id}
                                            type="button"
                                            onClick={() => toggleBenefit(String(benefit.id))}
                                            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${isSelected
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                                                }`}
                                        >
                                            {benefit.name_localized || benefit.name?.en}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Cover File Upload Card */}
                <Card className="w-full">
                    <CardHeader className="border-b">
                        <CardTitle>{t("attributes.image")}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FieldSet>
                            <FieldGroup>
                                <Field>
                                    <FileUpload
                                        name="cover"
                                        control={control}
                                        initialUrl={coverPreview}
                                    />
                                </Field>
                            </FieldGroup>
                        </FieldSet>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/hr/positions">
                        <Button type="button" variant="outline" disabled={isPending} className="gap-2">
                            <X className="size-4" />
                            {t("buttons.cancel")}
                        </Button>
                    </Link>
                    <Button type="submit" disabled={isPending} className="gap-2">
                        {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Save className="size-4" />
                        )}
                        {t("buttons.save")}
                    </Button>
                </div>
            </form>
        </div>
    );
}

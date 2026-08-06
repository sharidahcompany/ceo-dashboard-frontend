"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, NumericInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import DynamicIcon from "@/components/common/DynamicIcon";
import { toast } from "sonner";

import {
    PlanResource,
    FeatureResource,
    createFeature,
    updateFeature,
    deleteFeature,
    deletePlan,
    FeatureFormData
} from "@/actions/website/plans.actions";

interface PlansListProps {
    initialPlans: PlanResource[];
    initialFeatures: FeatureResource[];
}

const featureSchema = z.object({
    name: z.string().min(1, "validation.required"),
    slug: z.string().min(1, "validation.required").regex(/^[a-z0-9-]+$/, "validation.invalid_slug"),
    description: z.string().nullable().optional(),
    type: z.enum(["toggle", "consumable", "limit", "metered"]),
    sort_order: z.coerce.number().min(0),
});

type FeatureFormInput = {
    name: string;
    slug: string;
    description: string;
    type: "toggle" | "consumable" | "limit" | "metered";
    sort_order: number;
};

export default function PlansList({ initialPlans, initialFeatures }: PlansListProps) {
    const t = useTranslations();
    const params = useParams();
    const currentLocale = (params?.locale as string) || "en";

    const [plans, setPlans] = useState<PlanResource[]>(initialPlans);
    const [features, setFeatures] = useState<FeatureResource[]>(initialFeatures);
    const [isLoading, setIsLoading] = useState(false);

    // Active tab state
    const [activeTab, setActiveTab] = useState("plans");

    // Modal states for Features
    const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState<FeatureResource | null>(null);

    // Delete confirm modal states
    const [deletePlanId, setDeletePlanId] = useState<number | null>(null);
    const [deleteFeatureId, setDeleteFeatureId] = useState<number | null>(null);

    // Feature hook-form
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(featureSchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
            type: "limit",
            sort_order: 0,
        },
    });

    // Reset feature form for creation
    const handleAddFeatureClick = () => {
        setEditingFeature(null);
        reset({
            name: "",
            slug: "",
            description: "",
            type: "limit",
            sort_order: 0,
        });
        setIsFeatureModalOpen(true);
    };

    // Populate feature form for editing
    const handleEditFeatureClick = (feature: FeatureResource) => {
        setEditingFeature(feature);
        reset({
            name: feature.name,
            slug: feature.slug,
            description: feature.description || "",
            type: feature.type,
            sort_order: feature.sort_order,
        });
        setIsFeatureModalOpen(true);
    };

    // Submit Feature handler
    const onFeatureSubmit = async (data: any) => {
        setIsLoading(true);
        const payload: FeatureFormData = {
            name: data.name,
            slug: data.slug,
            description: data.description || null,
            type: data.type,
            sort_order: data.sort_order,
        };
        let res;
        if (editingFeature) {
            res = await updateFeature(editingFeature.id, payload);
        } else {
            res = await createFeature(payload);
        }

        if (res.success) {
            toast.success(t("messages.success", { defaultValue: "Saved successfully!" }));
            setIsFeatureModalOpen(false);
            // Refresh local features state
            const updatedFeatures = await fetch("/api/features-refresh").then(() => {
                // Since this runs in client, we can re-evaluate local state using mock fetch or updating state directly
                if (editingFeature) {
                    setFeatures(features.map(f => f.id === editingFeature.id ? { ...f, ...data } : f));
                } else {
                    // For create, we append a mock/temp ID or refresh page. Actually, refreshing state directly:
                    window.location.reload();
                }
            });
        } else {
            toast.error(res.error || t("errors.something_went_wrong"));
        }
        setIsLoading(false);
    };

    // Delete Plan Handler
    const handleConfirmDeletePlan = async () => {
        if (!deletePlanId) return;
        setIsLoading(true);
        const res = await deletePlan(deletePlanId);
        if (res.success) {
            toast.success(t("messages.success", { defaultValue: "Deleted successfully!" }));
            setPlans(plans.filter(p => p.id !== deletePlanId));
        } else {
            toast.error(res.error || t("errors.something_went_wrong"));
        }
        setIsLoading(false);
        setDeletePlanId(null);
    };

    // Delete Feature Handler
    const handleConfirmDeleteFeature = async () => {
        if (!deleteFeatureId) return;
        setIsLoading(true);
        const res = await deleteFeature(deleteFeatureId);
        if (res.success) {
            toast.success(t("messages.success", { defaultValue: "Deleted successfully!" }));
            setFeatures(features.filter(f => f.id !== deleteFeatureId));
        } else {
            toast.error(res.error || t("errors.something_went_wrong"));
        }
        setIsLoading(false);
        setDeleteFeatureId(null);
    };

    return (
        <Card>
            <CardHeader className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                <div>
                    <CardTitle>{t("plans.title", { defaultValue: "Plans & Features" })}</CardTitle>
                    <CardDescription>
                        {t("plans.description", { defaultValue: "Manage subscription plans, pricing, intervals, and attached feature limits." })}
                    </CardDescription>
                </div>
                {activeTab === "plans" ? (
                    <Link
                        href={`/${currentLocale}/website/plans/create`}
                        className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shrink-0")}
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t("plans.create_plan", { defaultValue: "Create Plan" })}</span>
                    </Link>
                ) : (
                    <Button size="sm" className="gap-1.5 shrink-0" onClick={handleAddFeatureClick}>
                        <Plus className="w-4 h-4" />
                        <span>{t("features.create_feature", { defaultValue: "Create Feature" })}</span>
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex justify-start">
                        <TabsList variant="default">
                            <TabsTrigger value="plans">{t("plans.plans_tab", { defaultValue: "Plans" })}</TabsTrigger>
                            <TabsTrigger value="features">{t("plans.features_tab", { defaultValue: "Feature Definitions" })}</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Plans tab content */}
                    <TabsContent value="plans" className="space-y-6">
                        {plans.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                {t("plans.no_plans", { defaultValue: "No plans found" })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map((plan) => (
                                    <div key={plan.id} className="relative flex flex-col justify-between rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow p-6">
                                        <div>
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg">{plan.name}</h3>
                                                    <p className="text-xs font-mono text-muted-foreground">{plan.slug}</p>
                                                </div>
                                                <div className="flex flex-col gap-1 items-end">
                                                    {plan.is_free ? (
                                                        <Badge className="bg-sky-500/10 text-sky-500 border border-sky-500/20 shadow-none">
                                                            {t("plans.free_badge", { defaultValue: "Free" })}
                                                        </Badge>
                                                    ) : (
                                                        <span className="font-extrabold text-lg text-primary">
                                                            {plan.price} {typeof plan.currency === "object" && plan.currency ? (plan.currency as any).symbol || (plan.currency as any).code : plan.currency}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-muted-foreground">
                                                        {plan.billing_period} {t(`plans.interval.${plan.billing_interval}`, { defaultValue: plan.billing_interval })}
                                                    </span>
                                                </div>
                                            </div>

                                            {plan.description && (
                                                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                                    {plan.description}
                                                </p>
                                            )}

                                            {plan.features && plan.features.length > 0 && (
                                                <div className="space-y-3 pt-4 border-t">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        {t("plans.features_section", { defaultValue: "Included Features" })}
                                                    </p>
                                                    <ul className="space-y-2">
                                                        {plan.features.map((feat) => (
                                                            <li key={feat.id} className="flex items-start gap-2 text-sm text-foreground">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                                <div className="flex-1 flex justify-between gap-2">
                                                                    <span>{feat.name}</span>
                                                                    <span className="font-semibold text-xs bg-muted px-2 py-0.5 rounded">
                                                                        {feat.type === "toggle"
                                                                            ? (feat.value ? "✓" : "✗")
                                                                            : feat.value}
                                                                    </span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t">
                                            <Badge variant={plan.is_active ? "default" : "outline"} className={plan.is_active ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20" : "bg-muted text-muted-foreground"}>
                                                {plan.is_active ? t("plans.active_badge", { defaultValue: "Active" }) : t("plans.inactive_badge", { defaultValue: "Inactive" })}
                                            </Badge>

                                            <div className="flex items-center gap-1.5">
                                                <Link
                                                    href={`/${currentLocale}/website/plans/edit/${plan.id}`}
                                                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-muted-foreground hover:text-foreground")}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setDeletePlanId(plan.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Features tab content */}
                    <TabsContent value="features" className="space-y-6">
                        {features.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                {t("features.no_features", { defaultValue: "No feature definitions found" })}
                            </div>
                        ) : (
                            <div className="rounded-xl border bg-card overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("features.fields.name", { defaultValue: "Name" })}</TableHead>
                                            <TableHead>{t("features.fields.slug", { defaultValue: "Slug" })}</TableHead>
                                            <TableHead>{t("features.fields.type", { defaultValue: "Type" })}</TableHead>
                                            <TableHead className="w-20 text-center">{t("features.fields.sort_order", { defaultValue: "Sort" })}</TableHead>
                                            <TableHead className="w-24 text-center">{t("actions.actions", { defaultValue: "Actions" })}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {features.map((feature) => (
                                            <TableRow key={feature.id} className="hover:bg-muted/40">
                                                <TableCell className="font-semibold text-foreground">
                                                    <div>
                                                        <p>{feature.name}</p>
                                                        {feature.description && (
                                                            <p className="text-xs text-muted-foreground font-normal">{feature.description}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {feature.slug}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-blue-500/20 shadow-none font-medium px-2 py-0.5 rounded-full text-xs">
                                                        {t(`features.types.${feature.type}`, { defaultValue: feature.type })}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-xs">
                                                    {feature.sort_order}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            onClick={() => handleEditFeatureClick(feature)}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setDeleteFeatureId(feature.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Feature Creation/Editing Modal */}
                <Dialog open={isFeatureModalOpen} onOpenChange={setIsFeatureModalOpen}>
                    <DialogContent className="sm:max-w-md" showCloseButton={!isLoading}>
                        <form onSubmit={handleSubmit(onFeatureSubmit)} className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingFeature
                                        ? t("features.edit_feature", { defaultValue: "Edit Feature" })
                                        : t("features.create_feature", { defaultValue: "Create Feature" })}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 py-2">
                                <Field>
                                    <FieldLabel>
                                        {t("features.fields.name", { defaultValue: "Feature Name" })}
                                    </FieldLabel>
                                    <Input
                                        {...register("name")}
                                        placeholder={t("features.placeholders.name", { defaultValue: "e.g. Storage Capacity" })}
                                    />
                                    {errors.name && <FieldError>{t(errors.name.message as any)}</FieldError>}
                                </Field>

                                <Field>
                                    <FieldLabel>
                                        {t("features.fields.slug", { defaultValue: "Slug" })}
                                    </FieldLabel>
                                    <Input
                                        {...register("slug")}
                                        placeholder={t("features.placeholders.slug", { defaultValue: "e.g. storage-capacity" })}
                                        className="text-left font-mono"
                                        dir="ltr"
                                    />
                                    {errors.slug && <FieldError>{t(errors.slug.message as any)}</FieldError>}
                                </Field>

                                <Field>
                                    <FieldLabel>
                                        {t("features.fields.type", { defaultValue: "Feature Type" })}
                                    </FieldLabel>
                                    <Controller
                                        control={control}
                                        name="type"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className="w-full h-8">
                                                    <SelectValue>
                                                        {field.value ? t(`features.types.${field.value}`) : null}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="limit">{t("features.types.limit", { defaultValue: "Limit (Numeric)" })}</SelectItem>
                                                    <SelectItem value="toggle">{t("features.types.toggle", { defaultValue: "Toggle (Boolean)" })}</SelectItem>
                                                    <SelectItem value="consumable">{t("features.types.consumable", { defaultValue: "Consumable" })}</SelectItem>
                                                    <SelectItem value="metered">{t("features.types.metered", { defaultValue: "Metered" })}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.type && <FieldError>{t(errors.type.message as any)}</FieldError>}
                                </Field>

                                <Field>
                                    <FieldLabel>
                                        {t("features.fields.sort_order", { defaultValue: "Sort Order" })}
                                    </FieldLabel>
                                    <NumericInput
                                        {...register("sort_order")}
                                        placeholder={t("plans.placeholders.sort_order", { defaultValue: "0" })}
                                    />
                                    {errors.sort_order && <FieldError>{t(errors.sort_order.message as any)}</FieldError>}
                                </Field>

                                <Field>
                                    <FieldLabel>
                                        {t("features.fields.description", { defaultValue: "Description" })}
                                    </FieldLabel>
                                    <textarea
                                        {...register("description")}
                                        rows={3}
                                        className="w-full flex min-h-[60px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder={t("features.placeholders.description", { defaultValue: "Brief details about feature options..." })}
                                    />
                                </Field>
                            </div>

                            <DialogFooter className="mt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsFeatureModalOpen(false)}
                                    disabled={isLoading}
                                >
                                    {t("buttons.cancel", { defaultValue: "Cancel" })}
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? t("actions.loading", { defaultValue: "Loading..." }) : t("buttons.save", { defaultValue: "Save" })}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Confirm Delete Plan Modal */}
                <Dialog open={deletePlanId !== null} onOpenChange={(open) => !open && setDeletePlanId(null)}>
                    <DialogContent showCloseButton={!isLoading}>
                        <DialogHeader>
                            <DialogTitle>
                                {t("common.confirm_delete_title", { defaultValue: "Confirm Delete" })}
                            </DialogTitle>
                            <DialogDescription>
                                {t("plans.delete_confirm", { defaultValue: "Are you sure you want to delete this plan?" })}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setDeletePlanId(null)}
                                disabled={isLoading}
                            >
                                {t("buttons.cancel", { defaultValue: "Cancel" })}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDeletePlan}
                                disabled={isLoading}
                            >
                                {isLoading ? t("actions.loading", { defaultValue: "Loading..." }) : t("buttons.delete", { defaultValue: "Delete" })}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Confirm Delete Feature Modal */}
                <Dialog open={deleteFeatureId !== null} onOpenChange={(open) => !open && setDeleteFeatureId(null)}>
                    <DialogContent showCloseButton={!isLoading}>
                        <DialogHeader>
                            <DialogTitle>
                                {t("common.confirm_delete_title", { defaultValue: "Confirm Delete" })}
                            </DialogTitle>
                            <DialogDescription>
                                {t("features.delete_confirm", { defaultValue: "Are you sure you want to delete this feature definition?" })}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteFeatureId(null)}
                                disabled={isLoading}
                            >
                                {t("buttons.cancel", { defaultValue: "Cancel" })}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDeleteFeature}
                                disabled={isLoading}
                            >
                                {isLoading ? t("actions.loading", { defaultValue: "Loading..." }) : t("buttons.delete", { defaultValue: "Delete" })}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </CardContent>
        </Card>
    );
}

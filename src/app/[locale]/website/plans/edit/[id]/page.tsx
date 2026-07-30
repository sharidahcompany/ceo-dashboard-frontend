import React from "react";
import PlanForm from "@/components/features/website/PlanForm";
import { getPlan, getFeatures } from "@/actions/website/plans.actions";
import { getCurrencies } from "@/actions/common/common.actions";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface EditPlanPageProps {
    params: Promise<{
        id: string;
        locale: string;
    }>;
}

export default async function EditPlanPage({ params }: EditPlanPageProps) {
    const t = await getTranslations("plans");
    const { id } = await params;
    const planId = Number(id);

    if (isNaN(planId)) {
        notFound();
    }

    const [planRes, featuresRes, currenciesRes] = await Promise.all([
        getPlan(planId),
        getFeatures(),
        getCurrencies()
    ]);

    if (!planRes.success || !planRes.data?.data) {
        notFound();
    }

    const plan = planRes.data.data;
    const features = featuresRes.success && featuresRes.data?.data ? featuresRes.data.data : [];
    const currencies = currenciesRes.success && currenciesRes.data ? currenciesRes.data : [];

    return (
        <Card className="max-w-6xl mx-auto">
            <CardHeader>
                <CardTitle>{t("edit_title")}: {plan.name}</CardTitle>
                <CardDescription>
                    {t("edit_description")}
                </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
                <PlanForm initialData={plan} featuresList={features} currencies={currencies} />
            </div>
        </Card>
    );
}

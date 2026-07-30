import React from "react";
import PlanForm from "@/components/features/website/PlanForm";
import { getFeatures } from "@/actions/website/plans.actions";
import { getCurrencies } from "@/actions/common/common.actions";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export default async function CreatePlanPage() {
    const t = await getTranslations("plans");
    const [featuresRes, currenciesRes] = await Promise.all([
        getFeatures(),
        getCurrencies()
    ]);
    const features = featuresRes.success && featuresRes.data?.data ? featuresRes.data.data : [];
    const currencies = currenciesRes.success && currenciesRes.data ? currenciesRes.data : [];

    return (
        <Card className="max-w-6xl mx-auto">
            <CardHeader>
                <CardTitle>{t("create_title")}</CardTitle>
                <CardDescription>
                    {t("create_description")}
                </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
                <PlanForm featuresList={features} currencies={currencies} />
            </div>
        </Card>
    );
}

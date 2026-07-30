import React from "react";
import PlansList from "@/components/features/website/PlansList";
import { getPlans, getFeatures } from "@/actions/website/plans.actions";

export default async function PlansPage() {
    const [plansRes, featuresRes] = await Promise.all([
        getPlans(),
        getFeatures()
    ]);

    const plans = plansRes.success && plansRes.data?.data ? plansRes.data.data : [];
    const features = featuresRes.success && featuresRes.data?.data ? featuresRes.data.data : [];

    return (
        <div className="max-w-6xl mx-auto">
            <PlansList initialPlans={plans} initialFeatures={features} />
        </div>
    );
}
import React, { Suspense } from "react";
import Goals from "@/components/features/company-spirit/Goals";
import { getGoals } from "@/actions/company-spirit/goal.actions";
import LoadingCards from "@/components/common/LoadingCards";

async function GoalsData() {
  const result = await getGoals();
  const goals = result.success ? result.data.data : [];
  return <Goals goals={goals ?? []} />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <LoadingCards />
      }
    >
      <GoalsData />
    </Suspense>
  );
}
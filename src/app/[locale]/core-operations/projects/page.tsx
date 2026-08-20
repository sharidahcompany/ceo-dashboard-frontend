import React from "react";
import ProjectsList from "@/components/features/core-operations/projects/ProjectsList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { getGoals } from "@/actions/company-spirit/goal.actions";
import { getTranslations } from "next-intl/server";
import { getVision } from "@/actions/company-spirit/vision.actions";
import Vision from "@/components/features/company-spirit/Vision";
import Goals from "@/components/features/company-spirit/Goals";

export default async function ProjectsPage() {
  const t = await getTranslations("projects");

  const result = await getGoals();
  const goals = result.success ? result.data.data : [];

  const response = await getVision();

  const vision = response.success ? response.data.data : null;

  return (
    <PermissionGate permission="workspace.project.view">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="pb-6 space-y-6">
          <Vision vision={vision ?? null} />
          <Goals goals={goals ?? []} />
          <ProjectsList />
        </CardContent>
      </Card>
    </PermissionGate>
  );
}

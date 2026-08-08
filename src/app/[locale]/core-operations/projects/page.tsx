import React from "react";
import ProjectsList from "@/components/features/core-operations/projects/ProjectsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function ProjectsPage() {
    const t = useTranslations("projects");

    return (
        <PermissionGate permission="workspace.project.view">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>{t("title")}</CardTitle>
                    <CardDescription>{t("description")}</CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                    <ProjectsList />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

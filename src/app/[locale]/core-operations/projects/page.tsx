import React from "react";
import ProjectsList from "@/components/features/core-operations/projects/ProjectsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function ProjectsPage() {
    const t = useTranslations("projects");

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>{t("description")}</CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
                <ProjectsList />
            </CardContent>
        </Card>
    );
}

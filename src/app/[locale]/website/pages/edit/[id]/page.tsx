"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import PagesForm from "@/components/features/website/PagesForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getPage, PageResource } from "@/actions/website/pages.actions";

export default function EditPage() {
    const t = useTranslations();
    const params = useParams();
    const [page, setPage] = useState<PageResource | undefined>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPage = async () => {
            if (!params?.id) return;
            setIsLoading(true);
            const res = await getPage(params.id as string);
            if (res.success && res.data) {
                setPage(res.data.data);
            }
            setIsLoading(false);
        };
        loadPage();
    }, [params?.id]);

    return (
        <Card className="max-w-6xl mx-auto">
            <CardHeader>
                <CardTitle>{t("routes.edit_page", { defaultValue: "Edit Page" })}</CardTitle>
                <CardDescription>
                    {t("pages.edit_description", { defaultValue: "Modify page content, slug, and publishing state." })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <Spinner className="w-6 h-6" />
                    </div>
                ) : !page ? (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                        {t("pages.not_found", { defaultValue: "Page not found" })}
                    </div>
                ) : (
                    <PagesForm initialData={page} />
                )}
            </CardContent>
        </Card>
    );
}
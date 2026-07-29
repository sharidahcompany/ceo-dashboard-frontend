import PagesForm from "@/components/features/website/PagesForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function CreatePage() {
    const t = useTranslations();
    return (
        <Card className="max-w-6xl mx-auto">
            <CardHeader>
                <CardTitle>{t("routes.create_page", { defaultValue: "Create Page" })}</CardTitle>
                <CardDescription>
                    {t("pages.create_description", { defaultValue: "Create a new custom page for your website." })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <PagesForm />
            </CardContent>
        </Card>
    );
}
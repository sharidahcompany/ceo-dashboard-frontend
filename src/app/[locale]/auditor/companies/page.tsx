import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CompaniesList from "@/components/features/auditor/CompaniesList";
import { getTranslations } from "next-intl/server";

export default async function CompaniesPage() {
    const t = await getTranslations("auditor");
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("companies")}</CardTitle>
                <CardDescription>{t("companies_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
                <CompaniesList />
            </CardContent>
        </Card>
    );
}
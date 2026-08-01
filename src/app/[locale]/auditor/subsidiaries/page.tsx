import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SubsidiariesList from "@/components/features/auditor/SubsidiariesList";
import { getTranslations } from "next-intl/server";

export default async function SubsidiariesPage() {
    const t = await getTranslations("auditor");
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("subsidiaries")}</CardTitle>
                <CardDescription>{t("subsidiaries_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
                <SubsidiariesList />
            </CardContent>
        </Card>
    );
}

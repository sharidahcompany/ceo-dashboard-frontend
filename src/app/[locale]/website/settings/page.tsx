import SettingForm from "@/components/features/website/SettingForm";
import DomainSettingForm from "@/components/features/website/DomainSettingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getAuthenticatedUser } from "@/actions/workspace/user.actions";

export default async function WebsiteSettingPage() {
    const t = await getTranslations();
    const userResult = await getAuthenticatedUser();
    const tenantId = userResult.success && userResult.data?.tenants?.[0]?.id 
        ? userResult.data.tenants[0].id 
        : 1; // Default or fallback tenant ID

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="tracking-tight">
                        {t("messages.domain_settings.title")}
                    </CardTitle>
                    <CardDescription>
                        {t("messages.domain_settings.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DomainSettingForm tenantId={tenantId} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="tracking-tight">
                        {t("messages.website_settings.title")}
                    </CardTitle>
                    <CardDescription>
                        {t("messages.website_settings.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingForm />
                </CardContent>
            </Card>
        </div>
    );
}

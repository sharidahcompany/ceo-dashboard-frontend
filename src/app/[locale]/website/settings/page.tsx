import SettingForm from "@/components/features/website/SettingForm";
import DomainSettingForm from "@/components/features/website/DomainSettingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getAuthenticatedUser } from "@/actions/workspace/user.actions";

export default async function WebsiteSettingPage() {
    const t = await getTranslations();
    const userResult = await getAuthenticatedUser();
    const tenantId =
    userResult.success
        ? userResult.data?.active_tenant?.tenant?.id
        : undefined;

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
                    {tenantId ? (
                        <DomainSettingForm tenantId={tenantId} />
                    ) : null}
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

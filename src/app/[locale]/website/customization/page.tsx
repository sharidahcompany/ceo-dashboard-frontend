import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WebsiteCustomization from "@/components/features/website/WebsiteCustomiztion";
import { useTranslations } from "next-intl";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function CustomizationPage() {
    const t = useTranslations();
    return (
        <PermissionGate permission="website.setting.view">
            <Card>
                <CardHeader>
                    <CardTitle>{t('messages.website_customization.title', { defaultValue: "Website Customization" })}</CardTitle>
                    <CardDescription>{t('messages.website_customization.description', { defaultValue: "" })}</CardDescription>
                </CardHeader>
                <CardContent>
                    <WebsiteCustomization />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WebsiteCustomization from "@/components/features/website/WebsiteCustomiztion";
import { useTranslations } from "next-intl";

export default function CustomizationPage() {
    const t = useTranslations();
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('messages.website_customization.title', { defaultValue: "Website Customization" })}</CardTitle>
                <CardDescription>{t('messages.website_customization.description', { defaultValue: "" })}</CardDescription>
            </CardHeader>
            <CardContent>
                <WebsiteCustomization />
            </CardContent>
        </Card>
    );
}
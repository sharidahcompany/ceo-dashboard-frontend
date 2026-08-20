import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/shared/PermissionGate";
import VerificationForm from "@/components/features/website/VerificationForm";

export default function VerificationPage() {
    const t = useTranslations("verification");

    return (
        <PermissionGate permission="website.setting.view">
            <Card>
                <CardHeader>
                    <CardTitle>{t("title")}</CardTitle>
                    <CardDescription>{t("description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <VerificationForm />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

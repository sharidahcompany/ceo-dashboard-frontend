import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/shared/PermissionGate";
import VerificationRequestsList from "@/components/features/website/VerificationRequestsList";

export default function VerificationRequestsPage() {
    const t = useTranslations("verification");

    return (
        <PermissionGate superAdminOnly>
            <Card>
                <CardHeader>
                    <CardTitle>{t("requests_title", { defaultValue: "Verification Requests" })}</CardTitle>
                    <CardDescription>
                        {t("requests_description", {
                            defaultValue: "Review and approve tenant verification documents.",
                        })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <VerificationRequestsList />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import IncomingRequestsList from "@/components/features/auditor/IncomingRequestsList";
import { getTranslations } from "next-intl/server";

export default async function IncomingRequestsPage() {
    const t = await getTranslations("auditor");
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("incoming_requests")}</CardTitle>
                <CardDescription>{t("incoming_requests_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
                <IncomingRequestsList />
            </CardContent>
        </Card>
    );
}

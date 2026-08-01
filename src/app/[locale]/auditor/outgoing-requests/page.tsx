import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OutgoingRequestsList from "@/components/features/auditor/OutgoingRequestsList";
import { getTranslations } from "next-intl/server";

export default async function OutgoingRequestsPage() {
    const t = await getTranslations("auditor");
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("outgoing_requests")}</CardTitle>
                <CardDescription>{t("outgoing_requests_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
                <OutgoingRequestsList />
            </CardContent>
        </Card>
    );
}

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/shared/PermissionGate";
import TicketsList from "@/components/features/tickets/TicketsList";

export default function TicketsPage() {
    const t = useTranslations("tickets");

    return (
        <PermissionGate permission="workspace.ticket.view">
            <Card>
                <CardHeader>
                    <CardTitle>{t("title")}</CardTitle>
                    <CardDescription>{t("description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <TicketsList />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

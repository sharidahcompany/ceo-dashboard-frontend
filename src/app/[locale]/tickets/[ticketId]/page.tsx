import { PermissionGate } from "@/components/shared/PermissionGate";
import TicketDetail from "@/components/features/tickets/TicketDetail";

export default async function TicketDetailPage({
    params,
}: {
    params: Promise<{ ticketId: string }>;
}) {
    const { ticketId } = await params;

    return (
        <PermissionGate permission="workspace.ticket.view">
            <TicketDetail ticketId={ticketId} />
        </PermissionGate>
    );
}

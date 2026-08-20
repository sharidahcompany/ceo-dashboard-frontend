import { TicketStatus } from "@/actions/workspace/tickets.actions";

/**
 * Ticket status colours, kept in step with the project status colours used on
 * the projects list.
 */
export function ticketStatusBadgeClass(status: TicketStatus | string) {
    switch (status) {
        case "solved":
            return "bg-green-500/10 text-green-500 border-green-500/20";
        case "in_progress":
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        case "open":
            return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
        default:
            return "bg-muted text-muted-foreground border-muted-foreground/20";
    }
}

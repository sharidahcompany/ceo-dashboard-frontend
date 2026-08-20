"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, Mail, Phone, Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useCan } from "@/providers/AbilityProvider";
import {
    getTicket,
    replyToTicket,
    TicketResource,
    updateTicketStatus,
} from "@/actions/workspace/tickets.actions";
import { ticketStatusBadgeClass } from "./ticket-status";

export default function TicketDetail({ ticketId }: { ticketId: string }) {
    const t = useTranslations("tickets");
    const canReply = useCan("workspace.ticket.reply");
    const canUpdate = useCan("workspace.ticket.update");

    const [ticket, setTicket] = useState<TicketResource | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const res = await getTicket(ticketId);
            if (cancelled) return;

            if (res.success) {
                setTicket(res.data.data);
            } else {
                toast.error(res.error);
            }
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [ticketId]);

    const handleReply = (event: React.FormEvent) => {
        event.preventDefault();
        if (!message.trim()) return;

        startTransition(async () => {
            const res = await replyToTicket(ticketId, message.trim());

            if (res.success) {
                // The reply also solves the ticket server-side, so take the
                // returned record rather than patching state by hand.
                setTicket(res.data.data);
                setMessage("");
                toast.success(t("reply_sent"));
            } else {
                toast.error(res.error);
            }
        });
    };

    const handleMarkSolved = () => {
        startTransition(async () => {
            const res = await updateTicketStatus(ticketId, "solved");

            if (res.success) {
                setTicket(res.data.data);
                toast.success(t("marked_solved"));
            } else {
                toast.error(res.error);
            }
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (!ticket) return null;

    const isSolved = ticket.status.value === "solved";

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="ghost" className="gap-2" render={<Link href="/tickets" />}>
                    <ArrowLeft className="size-4 rtl:rotate-180" />
                    {t("back")}
                </Button>

                <div className="flex items-center gap-2">
                    {ticket.project_id && (
                        <Button
                            variant="outline"
                            className="gap-2"
                            render={
                                <Link
                                    href={`/core-operations/projects/project/${ticket.project_id}/board`}
                                />
                            }
                        >
                            <ExternalLink className="size-4" />
                            {t("open_task")}
                        </Button>
                    )}

                    {canUpdate && !isSolved && (
                        <Button className="gap-2" disabled={isPending} onClick={handleMarkSolved}>
                            <CheckCircle2 className="size-4" />
                            {t("mark_solved")}
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <CardTitle>{ticket.subject}</CardTitle>
                            <CardDescription>{ticket.created_at}</CardDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className={ticketStatusBadgeClass(ticket.status.value)}
                        >
                            {ticket.status.label}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1 text-sm">
                        <p className="font-medium">{t("contact_details")}</p>
                        <p className="text-muted-foreground">{ticket.name}</p>
                        <p className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="size-3.5" />
                            {ticket.email}
                        </p>
                        {ticket.phone && (
                            <p className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="size-3.5" />
                                {ticket.phone}
                            </p>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <p className="text-sm font-medium">{t("visitor_message")}</p>
                        <p className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                            {ticket.message}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("conversation")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {ticket.replies && ticket.replies.length > 0 ? (
                        ticket.replies.map((reply) => (
                            <div key={reply.id} className="rounded-md border p-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        {reply.user
                                            ? `${reply.user.first_name} ${reply.user.last_name}`
                                            : ""}
                                    </span>
                                    <span>{reply.created_at}</span>
                                </div>
                                <p className="mt-2 text-sm whitespace-pre-wrap">{reply.message}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">{t("no_replies")}</p>
                    )}

                    {canReply && (
                        <form onSubmit={handleReply} className="space-y-2">
                            <Textarea
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                placeholder={t("reply_placeholder")}
                                rows={4}
                            />
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    className="gap-2"
                                    disabled={isPending || !message.trim()}
                                >
                                    <Send className="size-4" />
                                    {t("send_reply")}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

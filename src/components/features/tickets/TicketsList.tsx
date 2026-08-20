"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Mail, MessageSquare, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { useCan } from "@/providers/AbilityProvider";
import {
    deleteTickets,
    getTickets,
    TicketResource,
    TicketStats,
    TicketStatus,
} from "@/actions/workspace/tickets.actions";
import { ticketStatusBadgeClass } from "./ticket-status";

type StatusFilter = TicketStatus | "all";

const STATUS_FILTERS: StatusFilter[] = ["all", "open", "in_progress", "solved"];

export default function TicketsList() {
    const t = useTranslations("tickets");
    const canDelete = useCan("workspace.ticket.delete");

    const [tickets, setTickets] = useState<TicketResource[]>([]);
    const [stats, setStats] = useState<TicketStats | null>(null);
    const [status, setStatus] = useState<StatusFilter>("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        const res = await getTickets({
            status: status === "all" ? undefined : status,
            search: search.trim() || undefined,
        });

        if (res.success) {
            setTickets(res.data.data);
            setStats(res.data.stats);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    }, [status, search]);

    // Re-query on filter changes, debouncing so typing does not spam the API.
    useEffect(() => {
        const timer = setTimeout(fetchTickets, search ? 400 : 0);
        return () => clearTimeout(timer);
    }, [fetchTickets, search]);

    const handleDelete = (id: number) => {
        if (!window.confirm(t("delete_confirm"))) return;

        startTransition(async () => {
            const res = await deleteTickets([id]);
            if (res.success) {
                toast.success(t("deleted"));
                fetchTickets();
            } else {
                toast.error(res.error);
            }
        });
    };

    const countFor = (filter: StatusFilter) => stats?.[filter === "all" ? "all" : filter];

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Tabs value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
                    <TabsList>
                        {STATUS_FILTERS.map((filter) => (
                            <TabsTrigger key={filter} value={filter} className="gap-1.5">
                                {t(filter)}
                                {stats && (
                                    <span className="text-xs text-muted-foreground">
                                        {countFor(filter)}
                                    </span>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="relative sm:w-72">
                    <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t("search_placeholder")}
                        className="ps-9"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            ) : tickets.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <MessageSquare className="h-4 w-4" />
                        </EmptyMedia>
                        <EmptyTitle>{t("empty")}</EmptyTitle>
                        <EmptyDescription>{t("empty_description")}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("subject")}</TableHead>
                            <TableHead>{t("sender")}</TableHead>
                            <TableHead>{t("status")}</TableHead>
                            <TableHead>{t("replies")}</TableHead>
                            <TableHead>{t("received")}</TableHead>
                            {canDelete && <TableHead />}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/tickets/${ticket.id}`}
                                        className="hover:underline"
                                    >
                                        {ticket.subject}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{ticket.name}</span>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Mail className="size-3" />
                                            {ticket.email}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={ticketStatusBadgeClass(ticket.status.value)}
                                    >
                                        {ticket.status.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>{ticket.replies_count ?? 0}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {ticket.created_at}
                                </TableCell>
                                {canDelete && (
                                    <TableCell className="text-end">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={isPending}
                                            onClick={() => handleDelete(ticket.id)}
                                        >
                                            <Trash2 className="size-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}

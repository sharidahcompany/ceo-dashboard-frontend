"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DocumentEventResource } from "@/actions/workspace/documents.actions";

export interface DocumentActivityLogProps {
    events: DocumentEventResource[];
}

/**
 * The append-only audit trail. This is the evidence a simple electronic
 * signature rests on, so it shows the raw facts — who, when, from where.
 */
export default function DocumentActivityLog({ events }: DocumentActivityLogProps) {
    const t = useTranslations();

    if (events.length === 0) {
        return <p className="text-sm text-muted-foreground">{t("messages.documents.no_activity")}</p>;
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("messages.documents.event")}</TableHead>
                        <TableHead>{t("attributes.signer")}</TableHead>
                        <TableHead>{t("messages.documents.ip_address")}</TableHead>
                        <TableHead>{t("attributes.created_at")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {events.map((event) => (
                        <TableRow key={event.id}>
                            <TableCell>
                                <Badge variant="outline">
                                    {t(`enums.documentEvent.${event.event}`)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {event.signer?.name ?? (
                                    <span className="text-muted-foreground">
                                        {t(`enums.actorType.${event.actor_type}`)}
                                    </span>
                                )}
                            </TableCell>
                            <TableCell dir="ltr">{event.ip_address ?? "-"}</TableCell>
                            <TableCell dir="ltr">
                                {event.created_at?.replace("T", " ").substring(0, 19)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

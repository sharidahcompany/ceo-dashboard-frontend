"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { EditableStatusSelect } from "@/components/features/hr/EditableStatusSelect";
import {
    getOrders,
    deleteOrders,
    updateOrderStatus,
    OrderResource,
    OrderStatusValue,
} from "@/actions/website/orders.actions";
import { PermissionGate } from "@/components/shared/PermissionGate";

const STATUS_VARIANTS: Record<OrderStatusValue, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "secondary",
    CONFIRMED: "default",
    DELIVERED: "default",
    CANCELLED: "destructive",
};

function getCustomerName(customer: OrderResource["customer"]): string {
    if (!customer) return "-";
    return customer.name_localized || customer.name?.en || customer.name?.ar || "-";
}

export default function OrdersPage() {
    const t = useTranslations();
    const locale = useLocale();

    const statusOptions = useMemo(
        () =>
            (Object.keys(STATUS_VARIANTS) as OrderStatusValue[]).map((value) => ({
                value,
                label: t(`orders.status.${value}`),
                variant: STATUS_VARIANTS[value],
            })),
        [t]
    );

    const columns = useMemo<ColumnDef<OrderResource>[]>(
        () => [
            {
                accessorKey: "order_number",
                header: t("attributes.order_number"),
                cell: ({ row }) => row.original.order_number || "-",
            },
            {
                accessorKey: "customer",
                header: t("attributes.customer"),
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span>{getCustomerName(row.original.customer)}</span>
                        {row.original.customer?.email && (
                            <span className="text-xs text-muted-foreground">{row.original.customer.email}</span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "total",
                header: t("attributes.total"),
                cell: ({ row }) => {
                    const total = Number(row.original.total || 0);
                    return `${total.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${row.original.currency || ""}`.trim();
                },
            },
            {
                accessorKey: "created_at",
                header: t("attributes.created_at"),
                cell: ({ row }) => {
                    const date = new Date(row.original.created_at);
                    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString(locale);
                },
            },
            {
                accessorKey: "status",
                header: t("attributes.status"),
                cell: ({ row }) => {
                    const status = row.original.status;
                    // fall back to the raw value so the select trigger never
                    // shows blank if the backend adds a status we don't know about
                    const isKnownStatus = statusOptions.some((o) => o.value === status);
                    const options =
                        !isKnownStatus && status
                            ? [...statusOptions, { value: status, label: status, variant: "outline" as const }]
                            : statusOptions;

                    return (
                        <EditableStatusSelect
                            value={status ?? ""}
                            options={options}
                            onChange={(newValue) => updateOrderStatus(row.original.id, newValue as OrderStatusValue)}
                        />
                    );
                },
            },
        ],
        [t, locale, statusOptions]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteOrders(numericIds);
    };

    return (
        <PermissionGate permission="website.setting.view">
            <Card>
                <CardContent>
                    <DataGrid<OrderResource, any>
                        title={t("routes.orders")}
                        description={t("messages.website.orders_description")}
                        fetchAction={getOrders}
                        deleteAction={handleDelete}
                        columns={columns}
                        idKey="id"
                        editable={false}
                    />
                </CardContent>
            </Card>
        </PermissionGate>
    );
}

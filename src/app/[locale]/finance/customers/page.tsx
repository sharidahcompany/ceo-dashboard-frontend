"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    getCustomers,
    deleteCustomers,
    CustomerResource,
} from "@/actions/finance/customer.actions";
import { adaptWrappedListAction } from "@/lib/datagrid-adapter";

const fetchCustomers = adaptWrappedListAction(getCustomers);

export default function CustomersPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<CustomerResource>[]>(
        () => [
            {
                accessorKey: "name_localized",
                header: t("attributes.name") || "Name",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.name_localized || "-"}</span>
                ),
            },
            {
                accessorKey: "phone",
                header: t("attributes.phone") || "Phone",
                cell: ({ row }) => row.original.phone || "-",
            },
            {
                accessorKey: "email",
                header: t("attributes.email") || "Email",
                cell: ({ row }) => row.original.email || "-",
            },
            {
                accessorKey: "city",
                header: t("attributes.city") || "City",
                cell: ({ row }) => row.original.city || "-",
            },
            {
                accessorKey: "is_vat_registered",
                header: t("attributes.tax_number") || "VAT",
                cell: ({ row }) => (
                    <Badge variant={row.original.is_vat_registered ? "default" : "outline"}>
                        {row.original.is_vat_registered
                            ? row.original.tax_number || t("attributes.active") || "Registered"
                            : t("attributes.inactive") || "Not Registered"}
                    </Badge>
                ),
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteCustomers(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<CustomerResource, any>
                    title={t("routes.customers") || "Customers"}
                    fetchAction={fetchCustomers}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_customer") || "Add Customer"}
                />
            </CardContent>
        </Card>
    );
}

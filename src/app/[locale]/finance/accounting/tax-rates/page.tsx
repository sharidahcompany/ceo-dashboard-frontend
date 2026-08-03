"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    getTaxRates,
    deleteTaxRates,
    TaxRateResource,
} from "@/actions/finance/tax-rate.actions";
import { adaptWrappedListAction } from "@/lib/datagrid-adapter";

const fetchTaxRates = adaptWrappedListAction(getTaxRates);

export default function TaxRatesPage() {
    const t = useTranslations();

    const columns = useMemo<ColumnDef<TaxRateResource>[]>(
        () => [
            {
                accessorKey: "name_localized",
                header: t("attributes.name") || "Name",
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">{row.original.name_localized || "-"}</span>
                ),
            },
            {
                accessorKey: "tax_type",
                header: t("attributes.tax_type") || "Tax Type",
                cell: ({ row }) => row.original.tax_type?.label || "-",
            },
            {
                accessorKey: "tax_rate",
                header: t("attributes.tax_rate") || "Rate",
                cell: ({ row }) => `${row.original.tax_rate}%`,
            },
            {
                accessorKey: "is_system",
                header: t("attributes.type") || "Type",
                cell: ({ row }) => (
                    <Badge variant={row.original.is_system ? "secondary" : "outline"}>
                        {row.original.is_system
                            ? t("attributes.system") || "System"
                            : t("attributes.custom") || "Custom"}
                    </Badge>
                ),
            },
        ],
        [t]
    );

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteTaxRates(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<TaxRateResource, any>
                    title={t("routes.tax_rates") || "Tax Rates"}
                    fetchAction={fetchTaxRates}
                    deleteAction={handleDelete}
                    columns={columns}
                    idKey="id"
                    createTitle={t("routes.create_tax_rate") || "Add Tax Rate"}
                />
            </CardContent>
        </Card>
    );
}

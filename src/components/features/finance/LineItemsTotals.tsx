"use client";

import React from "react";
import { useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";

interface TotalsLineItem {
  quantity?: string | number;
  price?: string | number;
  discount_percent?: string | number;
  tax_rate_id?: string | number | null;
}

interface TaxRateOption {
  id: string | number;
  label?: string;
  rate: number;
}

interface CurrencyInfo {
  code: string;
  symbol?: string;
  currencyLabel?: string;
}

interface LineItemsTotalsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  taxRates: TaxRateOption[];
  currencies?: CurrencyInfo[];
}

export function computeTotals(
  items: TotalsLineItem[],
  taxAmountType: string | undefined,
  taxRates: TaxRateOption[],
) {
  const rateMap = new Map(taxRates.map((r) => [String(r.id), r.rate]));

  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  items.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const discountPercent = Number(item.discount_percent) || 0;
    const rate =
      item.tax_rate_id != null ? rateMap.get(String(item.tax_rate_id)) || 0 : 0;

    const lineGross = qty * price;
    const lineDiscount = lineGross * (discountPercent / 100);
    const lineNet = lineGross - lineDiscount;

    subtotal += lineGross;
    discountTotal += lineDiscount;

    if (taxAmountType === "INCLUSIVE") {
      taxTotal += lineNet - lineNet / (1 + rate / 100);
    } else {
      taxTotal += lineNet * (rate / 100);
    }
  });

  const net = subtotal - discountTotal;
  const total = taxAmountType === "INCLUSIVE" ? net : net + taxTotal;

  return { subtotal, discountTotal, taxTotal, total };
}

function formatAmount(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function LineItemsTotals({
  control,
  taxRates,
  currencies = [],
}: LineItemsTotalsProps) {
  const t = useTranslations();
  const items: TotalsLineItem[] = useWatch({ control, name: "items" }) || [];
  const taxAmountType: string | undefined = useWatch({
    control,
    name: "tax_amount_type",
  });
  const currencyCode: string | undefined = useWatch({
    control,
    name: "currency",
  });

  const { subtotal, discountTotal, taxTotal, total } = computeTotals(
    items,
    taxAmountType,
    taxRates,
  );

  const selectedCurrency = currencies.find((c) => c.code === currencyCode);
  const symbol = selectedCurrency?.symbol || currencyCode || "";
  const currencyLabel = selectedCurrency?.currencyLabel;

  const amountWithCurrency = (value: number) =>
    `${formatAmount(value)} ${symbol}${currencyLabel ? ` ` : ""}`;

  return (
    <div className="w-full flex justify-end pt-5">
      <div className="w-full md:w-80 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("attributes.subtotal") || "Subtotal"}
          </span>
          <span>{amountWithCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("attributes.discount_total") || "Discount"}
          </span>
          <span>-{amountWithCurrency(discountTotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("attributes.tax_total") || "Tax"}
          </span>
          <span>{amountWithCurrency(taxTotal)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold border-t pt-2">
          <span>{t("attributes.total") || "Total"}</span>
          <span>{amountWithCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}

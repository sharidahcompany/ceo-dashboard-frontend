export function formatCurrency(value: number, currency?: string, locale?: string): string {
    if (!currency) {
        return value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            currencyDisplay: "narrowSymbol",
        }).format(value);
    } catch {
        return `${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
    }
}

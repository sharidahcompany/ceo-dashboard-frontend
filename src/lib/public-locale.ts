import { routing } from "@/i18n/routing";

/**
 * Resolves a locale for the public /sign and /verify pages from a `?lang=`
 * query param — these routes sit outside src/app/[locale]/, so there is no
 * URL segment for next-intl's routing to read. The emailed signing link and
 * the QR-encoded verify link both carry `?lang=` for this reason.
 */
export function resolvePublicLocale(lang?: string | string[]): "ar" | "en" {
    const value = Array.isArray(lang) ? lang[0] : lang;
    return routing.locales.includes(value as any) ? (value as "ar" | "en") : routing.defaultLocale;
}

export async function loadPublicMessages(locale: "ar" | "en") {
    return (await import(`@/i18n/messages/${locale}.json`)).default;
}

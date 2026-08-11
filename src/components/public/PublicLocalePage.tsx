"use client";

import React, { useEffect } from "react";
import { NextIntlClientProvider } from "next-intl";

export interface PublicLocalePageProps {
    locale: "ar" | "en";
    messages: Record<string, unknown>;
    children: React.ReactNode;
}

/**
 * Wraps one public page's content in the correctly-resolved locale's
 * NextIntlClientProvider, and — since PublicShell's <html> can only guess a
 * static default (layouts get no searchParams in Next.js) — corrects
 * `lang`/`dir` on the real <html> element to match once mounted.
 *
 * The one-frame flash this can cause for a non-default locale (English) is an
 * accepted tradeoff on a small public utility page; there is no server-side
 * way around it without duplicating <html> across every route segment.
 */
export default function PublicLocalePage({ locale, messages, children }: PublicLocalePageProps) {
    useEffect(() => {
        const direction = locale === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = locale;
        document.documentElement.dir = direction;
    }, [locale]);

    return (
        <NextIntlClientProvider locale={locale} messages={messages as any}>
            {children}
        </NextIntlClientProvider>
    );
}

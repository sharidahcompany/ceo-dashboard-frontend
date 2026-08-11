import React from "react";
import PublicLocalePage from "@/components/public/PublicLocalePage";
import PublicSignClient from "@/components/features/documents/public/PublicSignClient";
import { getSigningSession } from "@/actions/public/document-public.actions";
import { loadPublicMessages, resolvePublicLocale } from "@/lib/public-locale";

export default async function SignPage({
    params,
    searchParams,
}: {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ lang?: string }>;
}) {
    const { token } = await params;
    const { lang } = await searchParams;
    const locale = resolvePublicLocale(lang);
    const messages = await loadPublicMessages(locale);

    const session = await getSigningSession(token);

    return (
        <PublicLocalePage locale={locale} messages={messages}>
            <PublicSignClient token={token} initialSession={session} />
        </PublicLocalePage>
    );
}

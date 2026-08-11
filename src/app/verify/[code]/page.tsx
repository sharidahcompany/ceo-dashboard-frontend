import React from "react";
import PublicLocalePage from "@/components/public/PublicLocalePage";
import VerifyResult from "@/components/features/documents/public/VerifyResult";
import { verifyDocument } from "@/actions/public/document-public.actions";
import { loadPublicMessages, resolvePublicLocale } from "@/lib/public-locale";

export default async function VerifyPage({
    params,
    searchParams,
}: {
    params: Promise<{ code: string }>;
    searchParams: Promise<{ lang?: string }>;
}) {
    const { code } = await params;
    const { lang } = await searchParams;
    const locale = resolvePublicLocale(lang);
    const messages = await loadPublicMessages(locale);

    const verification = await verifyDocument(code);

    return (
        <PublicLocalePage locale={locale} messages={messages}>
            <VerifyResult code={code} initialVerification={verification} />
        </PublicLocalePage>
    );
}

import { redirect } from "@/i18n/navigation";

export default async function AuditorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    redirect({ href: "/auditor/companies", locale })
}
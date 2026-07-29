import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function WebsitePage() {
    const locale = await getLocale();
    redirect({ href: "/website/settings", locale })

}
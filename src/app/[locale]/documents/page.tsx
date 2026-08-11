import { redirect } from "@/i18n/navigation";
import { useLocale } from "next-intl";

export default function Page() {
  const locale = useLocale();

  redirect({ href: "/documents/templates", locale: locale });
}

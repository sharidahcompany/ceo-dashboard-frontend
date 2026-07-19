"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Languages } from "lucide-react";
import Cookies from "js-cookie";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const emptySubscribe = () => () => {};

export default function LanguageSwitch() {
  const t = useTranslations("locale");
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!isMounted) {
    return null;
  }

  const locales = ["ar", "en"];

  const changeLocale = (nextLocale: string) => {
    Cookies.set("NEXT_LOCALE", nextLocale, { expires: 365, path: "/" });

    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9 relative">
        <Languages className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle language</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {locales.map((locale, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => changeLocale(locale)}
            className={`gap-2 cursor-pointer ${currentLocale === locale ? "bg-accent  " : ""}`}
          >
            <span className="text-xs uppercase font-mono bg-muted px-1.5 py-0.5 rounded border">
              {locale}
            </span>
            <span>{t(locale)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

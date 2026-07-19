"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Sun, Moon, Monitor } from "lucide-react";
import Cookies from "js-cookie";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const emptySubscribe = () => () => {};

export default function ThemeSwitch() {
  const t = useTranslations("theme");
  const { setTheme } = useTheme();

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!isMounted) {
    return null;
  }

  const themes = ["light", "dark", "system"];

  const changeTheme = (theme: string) => {
    setTheme(theme);
    Cookies.set("theme", theme, { expires: 365, path: "/" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9 relative">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((theme, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => changeTheme(theme)}
            className="gap-2"
          >
            {theme === "light" ? (
              <Sun className="h-4 w-4" />
            ) : theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Monitor className="h-4 w-4" />
            )}
            <span>{t(theme)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

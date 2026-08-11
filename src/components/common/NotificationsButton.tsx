import { Bell, BellOff } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function NotificationsButton() {
  const t = useTranslations("notifications");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9 relative">
        <Bell className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle language</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem
          disabled
          className="flex   items-center justify-center gap-2  text-center opacity-100"
        >
          <BellOff className="h-6 w-6 text-muted-foreground" />
          <span className="text-muted-foreground text-nowrap">
            {t("no_notifications")}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";
import LanguageSwitch from "../common/LanguageSwitch";
import ThemeSwitch from "../common/ThemeSwitch";
import { useTranslations } from "next-intl";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Search } from "lucide-react";
import NotificationsButton from "../common/NotificationsButton";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { usePathname } from "@/i18n/navigation";
import { Route, routes } from "@/app/routes";
import DynamicIcon from "../common/DynamicIcon";

export default function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();

  const activeService = (): Route | undefined => {
    return routes.find((route) => {
      return route.path.replace(/^\/+|\/+$/g, "") === pathname.split("/")[1];
    });
  };

  const currentService = activeService();

  return (
    <div className="flex justify-between items-center p-3 border-b">
      <div className="flex items-center gap-2">
        {currentService?.icon && (
          <DynamicIcon name={currentService.icon} size={20} />
        )}
        {currentService?.title && t(currentService.title)}
      </div>
      <div>
        <InputGroup>
          <InputGroupInput
            placeholder={t("attributes.search")}
            className="w-100"
          />
          <InputGroupAddon align="inline-end">
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="flex gap-5">
        <LanguageSwitch />
        <ThemeSwitch />
        <NotificationsButton />
        <Avatar>
          <AvatarImage
            src="https://github.com/shadcn.png"
            alt="@shadcn"
            className="aspect-square h-8 w-8"
          />
          <AvatarFallback className="bg-muted">SC</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

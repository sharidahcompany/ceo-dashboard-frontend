"use client";

import LanguageSwitch from "../common/LanguageSwitch";
import ThemeSwitch from "../common/ThemeSwitch";
import { useLocale, useTranslations } from "next-intl";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Navigation, Search, User, LogOut } from "lucide-react";
import NotificationsButton from "../common/NotificationsButton";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routes } from "@/app/routes";
import DynamicIcon from "../common/DynamicIcon";
import { getAuthenticatedUser, logout } from "@/actions/workspace/user.actions";
import { ensureActiveTenant } from "@/actions/workspace/organization.actions";
import { useAppStore } from "@/providers/StoreProvider";
import React from "react";
import { isAxiosError } from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = useLocale()
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const isRtl = locale === "ar";

  const setUserStore = useAppStore((state) => state.setUser);
  const user = useAppStore((state) => state.user);

  React.useEffect(() => {
    const fetchUser = async () => {
      // Settle the active tenant first: /auth/me scopes tenant_role by the
      // X-Tenant header, which api.ts only sends once the cookie exists.
      const { changed } = await ensureActiveTenant();
      if (changed) {
        window.location.reload();
        return;
      }

      const result = await getAuthenticatedUser();
      if (result.success) {
        setUserStore(result.data);
      } else {
        await logout();
        window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/${locale}/login` as string;
      }
    };

    fetchUser();
  }, [setUserStore]);

  const activeService = () => {
    return routes.find((route) => {
      return route.path.replace(/^\/+|\/+$/g, "") === pathname.split("/")[1];
    });
  };

  const currentService = activeService();
  const userFallback = user?.first_name
    ? user.first_name.slice(0, 1).toUpperCase() +
    " " +
    (user.last_name?.slice(0, 1).toUpperCase() || "")
    : "US";

  const handleLogout = async () => {
    await logout();
    window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/${locale}/login` as string;
  };

  return (
    <div className="flex justify-between items-center p-3 border-b">
      <div className="flex items-center gap-2">
        {currentService?.icon && (
          <DynamicIcon name={currentService.icon} size={20} />
        )}
        {currentService?.title && t(currentService.title)}
      </div>

      <div dir={isRtl ? "rtl" : "ltr"}>
        <InputGroup>
          <InputGroupInput
            placeholder={t("attributes.navigate_to", { defaultValue: "Navigate to..." })}
            className="w-100 cursor-pointer"
            readOnly
            onClick={() => setIsSearchOpen(true)}
          />
          <InputGroupAddon align="inline-end">
            <Navigation className="cursor-pointer" onClick={() => setIsSearchOpen(true)} />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex gap-5 items-center">
        <LanguageSwitch />
        <ThemeSwitch />
        <NotificationsButton />

        {!user ? (
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer outline-none">
              <Avatar>
                {user?.avatar && (
                  <AvatarImage
                    src={user.avatar}
                    alt={user.first_name || "User Avatar"}
                    className="aspect-square h-8 w-8"
                  />
                )}
                <AvatarFallback className="bg-muted text-xs">
                  {user?.first_name ? userFallback : "US"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2" onClick={() => router.push("/profile")}>
                <User className="h-4 w-4" />
                <span>{t("buttons.profile") || "Profile"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" variant="destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span>{t("buttons.logout") || "Logout"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className={isRtl ? "text-right" : "text-left"}>
            <DialogTitle>{t("attributes.navigate_to", { defaultValue: "Navigate to..." })}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 py-4">
            {routes.map((route) => (
              <button
                key={route.path}
                onClick={() => {
                  router.push(route.path);
                  setIsSearchOpen(false);
                }}
                className="flex items-center gap-3 w-full p-3 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground rtl:text-right ltr:text-left transition-all text-sm font-medium cursor-pointer"
                dir={isRtl ? "rtl" : "ltr"}
              >
                {route.icon && (
                  <div className="text-muted-foreground group-hover:text-foreground">
                    <DynamicIcon name={route.icon} size={18} />
                  </div>
                )}
                <span className="flex-1 text-foreground">
                  {t(route.title)}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

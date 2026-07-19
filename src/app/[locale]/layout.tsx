import "../globals.css";
import React from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import Sidebar from "@/components/layout/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/layout/Navbar";
import Tabbar from "@/components/layout/Tabbar";
import GlobalBreadcrumb from "@/components/layout/GlobalBreadcrumb";
import { getMeAction } from "@/actions/userActions";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const cairoFont = Cairo({
  variable: "--font-cairo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CEO App",
};

const themeScriptProps =
  typeof window === "undefined"
    ? undefined
    : ({ type: "application/json" } as const);

export default async function Layout({ children, params }: Props) {
  const cookieStore = await cookies();

  const savedTheme = cookieStore.get("theme")?.value || "system";

  const { locale } = await params;

  const direction = locale === "ar" ? "rtl" : "ltr";

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const me = await getMeAction();
  console.log(me);

  return (
    <html
      suppressHydrationWarning
      lang={locale}
      dir={direction}
      className={`${cairoFont.variable} h-full antialiased`}
    >
      <body>
        <NextIntlClientProvider>
          <ThemeProvider
            attribute={"class"}
            defaultTheme={savedTheme}
            disableTransitionOnChange
            enableSystem={false}
            scriptProps={themeScriptProps}
          >
            <TooltipProvider>
              <div className="flex min-h-screen">
                <div className="w-16 h-screen shrink-0 fixed top-0 inset-s-0">
                  <Sidebar />
                </div>

                <div className="flex-1 ms-16 flex flex-col min-h-screen">
                  <Navbar />
                  <Tabbar />
                  <GlobalBreadcrumb />
                  <main className="flex-1 p-5">{children}</main>
                </div>
              </div>

              <Toaster richColors toastOptions={{ className: "font-sans" }} />
            </TooltipProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

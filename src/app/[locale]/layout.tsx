import "../globals.css";
import React from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import AuthSidebar from "@/components/layout/AuthSidebar";
import { ThemeProvider } from "next-themes";
import { cookies } from "next/headers";
import ThemeSwitch from "@/components/common/ThemeSwitch";
import LanguageSwitch from "@/components/common/LanguageSwitch";
import { Toaster } from "sonner";
import { StepperWrapper } from "@/components/common/StepperWrapper";

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
            <div className="flex min-h-screen max-h-screen overflow-auto">
              <div className="w-full md:w-[50%]">
                <div className="p-5 flex gap-5">
                  <ThemeSwitch />
                  <LanguageSwitch />
                </div>
                <StepperWrapper>{children} </StepperWrapper>
              </div>
              <div className="w-[50%] h-screen hidden md:flex top-0 inset-e-0">
                <AuthSidebar />
              </div>
            </div>
            <Toaster richColors toastOptions={{ className: "font-sans" }} />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

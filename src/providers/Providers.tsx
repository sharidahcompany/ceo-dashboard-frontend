"use client";

import React from "react";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StoreProvider } from "./StoreProvider";
import { AbilityProvider } from "./AbilityProvider";
import { DirectionProvider, TextDirection } from "@base-ui/react";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

export default function Providers({
  children,
  themeScriptProps,
  savedTheme,
  locale,
  direction,
  messages,
}: {
  children: React.ReactNode;
  themeScriptProps?: any;
  savedTheme?: string;
  locale?: string;
  direction: TextDirection;
  messages: any;
}) {
  return (
    <React.Fragment>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="UTC"
      >
        <ThemeProvider
          attribute={"class"}
          defaultTheme={savedTheme}
          enableSystem={false}
          scriptProps={themeScriptProps}
        >
          <StoreProvider>
            <AbilityProvider>
              <DirectionProvider direction={direction}>
                <TooltipProvider>
                  <QueryClientProvider client={queryClient}>
                    {children}
                    <Toaster
                      richColors
                      toastOptions={{ className: "font-sans" }}
                    />
                  </QueryClientProvider>
                </TooltipProvider>
              </DirectionProvider>
            </AbilityProvider>
          </StoreProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </React.Fragment>
  );
}

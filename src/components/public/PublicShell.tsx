import React from "react";
import { Cairo } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";

import "../../app/globals.css";

const cairoFont = Cairo({
    variable: "--font-cairo",
    subsets: ["latin"],
});

/**
 * <html>/<body> skeleton for the two fully public pages (/sign, /verify).
 *
 * Deliberately minimal — no Sidebar/Navbar/Tabbar, no auth-derived Providers —
 * since these routes sit outside src/app/[locale]/ and are reached by anyone
 * holding a link or a QR code, logged in or not.
 *
 * Locale is intentionally NOT resolved here: only page.tsx receives
 * `searchParams` in Next.js, layouts do not. `lang`/`dir` are set to the
 * app-wide default (Arabic, RTL) and corrected by <PublicLocaleSync> once the
 * page below has resolved the real locale from `?lang=`.
 */
export default function PublicShell({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ar" dir="rtl" className={`${cairoFont.variable} h-full`} suppressHydrationWarning>
            <body className="min-h-screen bg-background text-foreground antialiased">
                <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-10 sm:px-6">
                    {children}
                </div>
                <Toaster richColors />
            </body>
        </html>
    );
}

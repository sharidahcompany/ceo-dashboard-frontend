import React from "react";
import type { Metadata } from "next";
import PublicShell from "@/components/public/PublicShell";

export const metadata: Metadata = {
    title: "Sign document",
};

/**
 * Second root layout in this app (the first is [locale]/layout.tsx). This is
 * intentional: omitting src/app/layout.tsx makes every top-level directory a
 * valid root layout, which is what lets /sign render its own <html>/<body>
 * with none of the dashboard chrome — no Sidebar, no auth Providers.
 */
export default function SignLayout({ children }: { children: React.ReactNode }) {
    return <PublicShell>{children}</PublicShell>;
}

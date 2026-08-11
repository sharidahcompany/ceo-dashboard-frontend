import React from "react";
import type { Metadata } from "next";
import PublicShell from "@/components/public/PublicShell";

export const metadata: Metadata = {
    title: "Verify document",
};

/**
 * Third root layout in this app. See src/app/sign/layout.tsx for why this is
 * safe: omitting src/app/layout.tsx makes every top-level directory its own
 * root, so /verify gets a clean <html>/<body> with no dashboard chrome.
 */
export default function VerifyLayout({ children }: { children: React.ReactNode }) {
    return <PublicShell>{children}</PublicShell>;
}

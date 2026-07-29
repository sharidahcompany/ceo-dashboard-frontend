"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, Palette, Layout, Rocket, Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ThemeStorePage() {
    const t = useTranslations();
    const params = useParams();
    const isRtl = params?.locale === "ar";
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setIsSubmitted(true);
        toast.success(t("messages.notify_success", { defaultValue: "We will notify you once the Theme Store is live!" }));
        setEmail("");
    };

    const previewThemes = [
        {
            name: t("themeStore.preview1_title", { defaultValue: "NeoCommerce" }),
            desc: t("themeStore.preview1_desc", { defaultValue: "Ultra-fast product grid, sleek modern layout, and clean Checkout interface." }),
            badge: "eCommerce",
            color: "from-blue-500 to-indigo-600",
            icon: Palette
        },
        {
            name: t("themeStore.preview2_title", { defaultValue: "Alpha Portfolio" }),
            desc: t("themeStore.preview2_desc", { defaultValue: "High-end glassmorphism portfolio cards for creative agencies and developers." }),
            badge: "Creative",
            color: "from-purple-500 to-pink-600",
            icon: Layout
        },
        {
            name: t("themeStore.preview3_title", { defaultValue: "SaaS Launchpad" }),
            desc: t("themeStore.preview3_desc", { defaultValue: "Bold typography, interactive charts mockup, and conversion-optimized landing section." }),
            badge: "Software",
            color: "from-amber-500 to-orange-600",
            icon: Rocket
        }
    ];

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background" dir={isRtl ? "rtl" : "ltr"}>
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[80px] pointer-events-none animate-pulse duration-4000" />
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none animate-pulse duration-3000" />

            <div className="max-w-4xl w-full text-center z-10 space-y-12">
                {/* Header Badge & Title */}
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold animate-bounce">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t("themeStore.badge", { defaultValue: "Next-gen storefront designs" })}</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                        {t("themeStore.title_pre", { defaultValue: "Customize Your Store With" })}{" "}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                            {t("themeStore.title_gradient", { defaultValue: "Theme Store" })}
                        </span>
                    </h1>
                    
                    <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                        {t("themeStore.subtitle", { defaultValue: "We are building a marketplace of stunning, responsive e-commerce and portfolio themes optimized for lightning fast loading and maximum conversions." })}
                    </p>
                </div>

                {/* Notify Form */}
                <div className="max-w-md mx-auto p-1 bg-muted border rounded-xl shadow-xs">
                    {isSubmitted ? (
                        <div className="py-3 px-4 flex items-center justify-center gap-2 text-primary font-medium text-sm">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>{t("themeStore.subscribed", { defaultValue: "You are on the launch list!" })}</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                            <Input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t("themeStore.email_placeholder", { defaultValue: "Enter your email for early access" })}
                                className={`bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 ${isRtl ? "text-right" : "text-left"}`}
                            />
                            <Button type="submit" className="gap-2 shrink-0">
                                <Bell className="w-4 h-4" />
                                <span>{t("themeStore.notify_btn", { defaultValue: "Notify Me" })}</span>
                            </Button>
                        </form>
                    )}
                </div>

                {/* Creative Teaser Grid */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 ${isRtl ? "text-right" : "text-left"}`}>
                    {previewThemes.map((theme, i) => {
                        const Icon = theme.icon;
                        return (
                            <div key={i} className="border rounded-2xl p-6 bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
                                <div className={`absolute top-0 ${isRtl ? "left-0 rounded-br-full" : "right-0 rounded-bl-full"} w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none`} />
                                <div className={`inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-br ${theme.color} text-white mb-4 shadow-sm`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">{theme.badge}</span>
                                <h3 className="text-lg font-bold group-hover:text-primary transition-colors mb-2">{theme.name}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{theme.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
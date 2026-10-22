// A57_G04_17C_CAMPAIGN_WIZARD_R2_20261020
// A57_G04_18C_AGENCY_CENTER_PREVIEW_R1_20261020
"use client";

// A57_G04_14_GLASS_COMMAND_CENTER
// A57_G04_17B_SIMPLIFIED_MARKETING_UX_20261020
// Presentation and navigation only. Domain contracts unchanged.

import { useState } from "react";
import MarketingProductSelector from "@/components/features/marketing/MarketingProductSelector";
import MarketingCommercialEditor from "@/components/features/marketing/MarketingCommercialEditor";
import MarketingCampaignWorkspace from "@/components/features/marketing/MarketingCampaignWorkspace";
import MarketingAgencyCenter from "@/components/features/marketing/MarketingAgencyCenter";
import MarketingCampaignWizard from "@/components/features/marketing/MarketingCampaignWizard";
import {
  GlassCapsule,
  GlassCircle,
  GlassPanel,
} from "@/components/ui/ceo-glass";
import glassTheme from "@/components/ui/ceo-glass.module.css";

type View = "home" | "campaign" | "commercial" | "workspace" | "agency" | "legacyCampaign";

const steps = [
  { key: "campaign", number: "01", title: "إعداد الحملة" },
  { key: "commercial", number: "02", title: "الميزانية والعمولات" },
] as const;

export default function MarketingPage() {
  const [view, setView] = useState<View>("home");

  return (
    <main
      dir="rtl"
      className={`${glassTheme.shell} min-h-screen px-4 py-8 sm:px-6`}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center gap-4">
          <GlassCircle size={66} label="التسويق">
            <span className="text-2xl" aria-hidden="true">✦</span>
          </GlassCircle>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold opacity-70">
              CEO APP · MARKETING 360
            </p>
            <h1 className="mt-1 text-3xl font-bold">حملاتي</h1>
            <p className="mt-2 text-sm opacity-70">
              خطط لحملاتك وأدر ميزانيتها من مكان واحد.
            </p>
          </div>
          {view !== "home" && (
            <button
              type="button"
              className="rounded-full border px-5 py-3 text-sm font-semibold"
              onClick={() => setView("home")}
            >
              العودة إلى حملاتي
            </button>
          )}
        </header>

        {view === "home" ? (
          <>
            <GlassPanel>
              <div className="space-y-5 px-2 py-3">
                <div>
                  <p className="text-xs font-bold text-[#a67c00]">
                    التسويق ببساطة
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    ما الذي تريد عمله؟
                  </h2>
                  <p className="mt-3 text-sm leading-7 opacity-70">
                    ابدأ بإعداد حملة جديدة، ثم انتقل إلى
                    تخطيط الميزانية والعمولات عند الحاجة.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-[#FFD700] px-7 py-4 text-sm font-bold text-neutral-950"
                    onClick={() => setView("campaign")}
                  >
                    + إنشاء حملة
                  </button>
                  <button
                    type="button"
                    className="rounded-full border px-7 py-4 text-sm font-semibold"
                    onClick={() => setView("commercial")}
                  >
                    ميزانية حملة موجودة
                  </button>
                </div>
              </div>
            </GlassPanel>

            <div className="px-2">
              <button
                type="button"
                className="rounded-full border px-5 py-3 text-sm"
                onClick={() => setView("legacyCampaign")}
              >
                نموذج الكتالوج الحالي — أداة متقدمة
              </button>
            </div>

            <GlassPanel>
              <div className="space-y-3 px-2">
                <h2 className="text-lg font-bold">
                  الحملات المحفوظة
                </h2>
                <p className="text-sm leading-7 opacity-70">
                  ربط قائمة حملات المنشأة بالخادم قيد التطوير.
                  لن نعرض بيانات تقديرية على أنها حملات حقيقية.
                </p>
              </div>
            </GlassPanel>

            <GlassPanel>
              <div className="space-y-3 px-2">
                <h2 className="text-lg font-bold">
                  أعمال وكالات التسويق
                </h2>
                <p className="text-sm leading-7 opacity-70">
                  إدارة الطلبات ومشاريع العملاء والتسليمات
                  ضمن مساحة الوكالة.
                </p>
                <button
                  type="button"
                  className="rounded-full bg-[#FFD700] px-6 py-3 text-sm font-bold text-neutral-950"
                  onClick={() => setView("agency")}
                >
                  فتح مركز أعمال الوكالة
                </button>
              </div>
            </GlassPanel>

            <div className="px-2">
              <button
                type="button"
                className="rounded-full border px-5 py-3 text-sm"
                onClick={() => setView("workspace")}
              >
                مساحة تجهيز الحملة — أداة مساعدة
              </button>
            </div>
          </>
        ) : view === "agency" ? (
          <MarketingAgencyCenter />
        ) : view === "campaign" ? (
          <MarketingCampaignWizard />
        ) : (
          <>
            {view !== "workspace" && (
              <GlassCapsule>
                <nav
                  aria-label="خطوات إعداد الحملة"
                  className="flex flex-wrap gap-3"
                >
                  {steps.map((step) => {
                    const active = step.key === view;
                    return (
                      <button
                        key={step.key}
                        type="button"
                        aria-current={active ? "step" : undefined}
                        onClick={() => setView(step.key)}
                        className={`rounded-full border px-5 py-3 text-sm font-semibold ${
                          active
                            ? "border-[#d9ae22] bg-[#FFD700] text-neutral-950"
                            : "border-neutral-300"
                        }`}
                      >
                        {step.number} · {step.title}
                      </button>
                    );
                  })}
                </nav>
              </GlassCapsule>
            )}

            <GlassPanel>
              <div className="space-y-3 px-2">
                <h2 className="text-xl font-bold">
                  {view === "legacyCampaign"
                    ? "إعداد حملة"
                    : view === "commercial"
                      ? "ميزانية الحملة واتفاقات التسويق"
                      : "مساحة تجهيز الحملة"}
                </h2>
                <p className="text-sm leading-7 opacity-70">
                  {view === "legacyCampaign"
                    ? "اختر المنتجات ثم أدخل اسم الحملة وهدفها."
                    : view === "commercial"
                      ? "حدد الميزانية النقدية والعمولات بصورة منفصلة."
                      : "مراجعة مساعدة لا تغيّر حالة الحملة المحفوظة."}
                </p>
              </div>
            </GlassPanel>

            <div className="min-w-0">
              {view === "legacyCampaign" ? (
                <MarketingProductSelector />
              ) : view === "commercial" ? (
                <MarketingCommercialEditor />
              ) : (
                <MarketingCampaignWorkspace
                  onNavigate={(destination) => setView(destination)}
                />
              )}
            </div>

            {view === "legacyCampaign" && (
              <button
                type="button"
                className="rounded-full border px-6 py-3 text-sm font-semibold"
                onClick={() => setView("commercial")}
              >
                الانتقال إلى تخطيط الميزانية
              </button>
            )}
          </>
        )}

        <p className="text-center text-xs leading-6 opacity-60">
          CEO Glass · البيئة المحلية ·
          العمليات المحمية تبقى خاضعة للصلاحيات وبوابات التشغيل
        </p>
      </div>
    </main>
  );
}

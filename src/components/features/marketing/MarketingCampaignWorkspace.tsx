"use client";

// A57_G04_16_CAMPAIGN_WORKSPACE_R1_20261020
// A57_G04_16A_WHITE_BACKGROUND_AND_WORKSPACE_REFINEMENT_20261020
// Local UI preparation only. Does not mutate campaign lifecycle.

import { useState } from "react";
import {
  GlassCapsule,
  GlassCircle,
  GlassPanel,
  SmartNextAction,
} from "@/components/ui/ceo-glass";

type Destination = "campaign" | "commercial";

type Props = {
  onNavigate: (destination: Destination) => void;
};

type CheckItem = {
  key: string;
  title: string;
  detail: string;
};

const checks: CheckItem[] = [
  {
    key: "objective",
    title: "وضوح الهدف التسويقي",
    detail: "هل تم تحديد الهدف والرسالة الرئيسة للحملة بصورة واضحة؟",
  },
  {
    key: "products",
    title: "اختيار المنتجات المرتبطة",
    detail: "هل المنتجات المختارة من الكتالوج مناسبة لنطاق الحملة؟",
  },
  {
    key: "budget",
    title: "توزيع الميزانية النقدية",
    detail: "هل تم توزيع المبلغ المخطط على القنوات التسويقية؟",
  },
  {
    key: "agreements",
    title: "اتفاقات المستفيدين",
    detail: "هل تم توضيح الثابت والعمولات وأساس الاستحقاق؟",
  },
];

export default function MarketingCampaignWorkspace({
  onNavigate,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const progress = Math.round((selected.length / checks.length) * 100);

  function toggle(key: string) {
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      <GlassPanel>
        <div className="flex flex-wrap items-center gap-5">
          <GlassCircle size={88} label="نسبة الإنجاز المحلية">
            <span className="text-lg font-bold" style={{ color: "#a67c00" }}>
              {progress}%
            </span>
          </GlassCircle>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-[0.18em]" style={{ color: "#a67c00" }}>
              CAMPAIGN WORKSPACE
            </p>
            <h3 className="mt-2 text-2xl font-bold">
              مساحة عمل الحملة
            </h3>
            <p className="mt-2 text-sm leading-7 text-neutral-600">
              لوحة عملية مبسطة لمراجعة جاهزية الحملة. هذه المؤشرات محلية داخل الواجهة
              ولا تمثل اعتمادًا محفوظًا أو تغييرًا لحالة الحملة.
            </p>
          </div>
        </div>
      </GlassPanel>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCapsule>
          <p className="text-xs text-neutral-500">حالة التجهيز</p>
          <p className="mt-2 text-lg font-bold">{selected.length} / {checks.length}</p>
          <p className="mt-1 text-sm text-neutral-600">عناصر تم تعليمها محليًا</p>
        </GlassCapsule>

        <GlassCapsule>
          <p className="text-xs text-neutral-500">الطبيعة</p>
          <p className="mt-2 text-lg font-bold">مراجعة تشغيلية</p>
          <p className="mt-1 text-sm text-neutral-600">بدون أي تعديل على قاعدة البيانات</p>
        </GlassCapsule>

        <GlassCapsule>
          <p className="text-xs text-neutral-500">الهدف</p>
          <p className="mt-2 text-lg font-bold">تنظيم العمل</p>
          <p className="mt-1 text-sm text-neutral-600">وتسهيل الانتقال بين أدوات الحملة</p>
        </GlassCapsule>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {checks.map((item, index) => {
          const completed = selected.includes(item.key);

          return (
            <GlassPanel key={item.key}>
              <div className="flex items-start gap-4">
                <GlassCircle size={52} label={completed ? "مكتمل محليًا" : "غير مكتمل"}>
                  <span className="font-bold">
                    {completed ? "✓" : index + 1}
                  </span>
                </GlassCircle>

                <div className="min-w-0 flex-1">
                  <h4 className="text-lg font-bold">{item.title}</h4>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">
                    {item.detail}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      aria-pressed={completed}
                      onClick={() => toggle(item.key)}
                      className="rounded-full border border-[#d8c27a] bg-white/75 px-5 py-2 text-sm font-semibold text-neutral-900 hover:bg-[#fff4c2]"
                    >
                      {completed ? "إلغاء العلامة" : "وضع علامة تجهيز"}
                    </button>

                    <GlassCapsule>
                      <span className="text-sm">
                        {completed ? "تمت المراجعة محليًا" : "بانتظار المراجعة"}
                      </span>
                    </GlassCapsule>
                  </div>
                </div>
              </div>
            </GlassPanel>
          );
        })}
      </div>

      <GlassPanel>
        <h4 className="text-lg font-bold">الانتقال إلى أدوات الحملة</h4>
        <p className="mt-2 text-sm leading-7 text-neutral-600">
          استخدم الأزرار التالية للعودة إلى أقسام الإعداد والتخطيط التجاري.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate("campaign")}
            className="rounded-full bg-[#FFD700] px-6 py-3 text-sm font-bold text-neutral-950"
          >
            إعداد الحملة والمنتجات
          </button>

          <button
            type="button"
            onClick={() => onNavigate("commercial")}
            className="rounded-full border border-neutral-300 bg-white/75 px-6 py-3 text-sm font-bold text-neutral-950"
          >
            الميزانية واتفاقات التسويق
          </button>
        </div>

        <div className="mt-5">
          <GlassCapsule>
            <p className="text-sm leading-7">
              هذه اللوحة مخصصة لتنظيم العمل ومراجعة الجاهزية فقط، ولا تنشئ اعتمادًا،
              ولا تغيّر حالة الحملة، ولا تولد التزامات أو قيودًا مالية.
            </p>
          </GlassCapsule>
        </div>
      </GlassPanel>

      <SmartNextAction
        title="الإجراء التالي"
        description={
          selected.length === checks.length
            ? "قائمة المراجعة المحلية مكتملة. راجع تفاصيل الحملة والميزانية من النماذج قبل أي اعتماد لاحق."
            : "استكمل مراجعة العناصر أو انتقل إلى أدوات الحملة لإدخال التفاصيل الناقصة."
        }
        actionLabel={selected.length === checks.length ? "فتح الميزانية" : "فتح إعداد الحملة"}
        onAction={() => onNavigate(selected.length === checks.length ? "commercial" : "campaign")}
      />
    </div>
  );
}

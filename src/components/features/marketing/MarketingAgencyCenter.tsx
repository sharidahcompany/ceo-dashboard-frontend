"use client";

// A57_G04_18C_AGENCY_CENTER_PREVIEW_R1_20261020
// Isolated visual prototype. No real customer/project records.
// No Marketplace, Finance or project-management mutations.

import { useState } from "react";
import {
  GlassCapsule,
  GlassCircle,
  GlassPanel,
} from "@/components/ui/ceo-glass";

type Section = "requests" | "projects" | "deliverables";

const requests = [
  {
    id: "DEMO-REQ-01",
    title: "إدارة حملة إطلاق منتج",
    category: "إدارة حملة",
    scope: "تخطيط القنوات وإنتاج المحتوى وإدارة الإعلانات",
  },
  {
    id: "DEMO-REQ-02",
    title: "إنتاج فيديو إعلاني",
    category: "إنتاج فيديو",
    scope: "تصوير ومونتاج نسخة إعلانية قصيرة",
  },
  {
    id: "DEMO-REQ-03",
    title: "إدارة حسابات التواصل",
    category: "إدارة حسابات",
    scope: "إعداد المحتوى وجدولة النشر والمتابعة",
  },
];

const projects = [
  {
    id: "DEMO-PRJ-01",
    title: "مشروع حملة إطلاق",
    client: "عميل تجريبي أ",
    phase: "إنتاج المواد",
    progress: 45,
    tasks: ["إعداد خطة المحتوى", "تصميم الصور", "مراجعة العميل"],
  },
  {
    id: "DEMO-PRJ-02",
    title: "مشروع محتوى موسمي",
    client: "عميل تجريبي ب",
    phase: "مراجعة التسليمات",
    progress: 75,
    tasks: ["إنتاج الفيديو", "رفع النسخة", "اعتماد العميل"],
  },
];

const deliverables = [
  {
    id: "DEMO-DEL-01",
    title: "فيديو إعلاني — نسخة 03",
    project: "مشروع حملة إطلاق",
    state: "بانتظار اعتماد العميل",
  },
  {
    id: "DEMO-DEL-02",
    title: "مجموعة صور إعلانية",
    project: "مشروع محتوى موسمي",
    state: "بانتظار تعديلات",
  },
];

const nav: { id: Section; name: string }[] = [
  { id: "requests", name: "طلبات العملاء" },
  { id: "projects", name: "المشاريع" },
  { id: "deliverables", name: "التسليمات والاعتمادات" },
];

export default function MarketingAgencyCenter() {
  const [section, setSection] = useState<Section>("requests");
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div dir="rtl" className="space-y-5">
      <GlassPanel>
        <div className="flex flex-wrap items-center gap-5">
          <GlassCircle size={72} label="مركز الوكالة">
            <span className="text-2xl" aria-hidden="true">✦</span>
          </GlassCircle>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold opacity-70">
              CEO APP · BUSINESS SOCIAL
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              مركز أعمال الوكالة
            </h2>
            <p className="mt-2 text-sm leading-7 opacity-70">
              متابعة فرص التسويق وطلبات العملاء والمشاريع
              والتسليمات من مساحة عمل واحدة.
            </p>
          </div>
        </div>
      </GlassPanel>

      <div
        role="status"
        className="rounded-full border border-amber-500/50 px-5 py-3 text-sm"
      >
        وضع المعاينة: جميع الطلبات والمشاريع أدناه
        بيانات توضيحية، وليست معاملات حقيقية.
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <GlassCapsule>
          <p className="text-xs opacity-70">طلبات تجريبية</p>
          <p className="mt-2 text-2xl font-bold">{requests.length}</p>
        </GlassCapsule>
        <GlassCapsule>
          <p className="text-xs opacity-70">مشاريع تجريبية</p>
          <p className="mt-2 text-2xl font-bold">{projects.length}</p>
        </GlassCapsule>
        <GlassCapsule>
          <p className="text-xs opacity-70">تسليمات تجريبية</p>
          <p className="mt-2 text-2xl font-bold">{deliverables.length}</p>
        </GlassCapsule>
      </div>

      <GlassPanel>
        <nav
          aria-label="أقسام أعمال الوكالة"
          className="flex flex-wrap gap-2"
        >
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={section === item.id}
              onClick={() => {
                setSection(item.id);
                setExpanded(null);
              }}
              className={`rounded-full border px-5 py-3 text-sm font-semibold ${
                section === item.id
                  ? "border-[#d8ae22] bg-[#FFD700] text-neutral-950"
                  : "border-current/20"
              }`}
            >
              {item.name}
            </button>
          ))}
        </nav>
      </GlassPanel>

      {section === "requests" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">طلبات العملاء</h3>
          <p className="text-sm opacity-70">
            طلبات تجريبية توضح طريقة عرض فرص سوق الأعمال
            والدعوات المباشرة.
          </p>

          {requests.map((request) => (
            <GlassPanel key={request.id}>
              <div className="space-y-3">
                <GlassCapsule>
                  <span className="text-xs font-semibold">
                    {request.category}
                  </span>
                </GlassCapsule>
                <h4 className="text-lg font-bold">{request.title}</h4>
                <p className="text-sm leading-7 opacity-70">
                  {request.scope}
                </p>
                <button
                  type="button"
                  onClick={() => setExpanded(
                    expanded === request.id ? null : request.id
                  )}
                  className="rounded-full border px-5 py-2 text-sm font-semibold"
                >
                  {expanded === request.id
                    ? "إخفاء تفاصيل الطلب"
                    : "عرض تفاصيل الطلب"}
                </button>
                {expanded === request.id && (
                  <p className="text-sm leading-7 opacity-70">
                    {request.id} — بعد ربط سوق الأعمال ستظهر
                    هنا بيانات العميل المصرح بها وشروط
                    تقديم العرض ومدة التنفيذ.
                  </p>
                )}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {section === "projects" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">المشاريع التسويقية</h3>
          {projects.map((project) => (
            <GlassPanel key={project.id}>
              <div className="space-y-3">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold">{project.title}</h4>
                    <p className="mt-1 text-sm opacity-70">
                      {project.client} · {project.phase}
                    </p>
                  </div>
                  <GlassCircle size={56} label="نسبة تقدم تجريبية">
                    <span className="text-sm font-bold">
                      {project.progress}%
                    </span>
                  </GlassCircle>
                </div>

                <div
                  className="h-2 overflow-hidden rounded-full bg-neutral-400/20"
                  role="progressbar"
                  aria-label="نسبة تقدم تجريبية"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={project.progress}
                >
                  <div
                    className="h-full rounded-full bg-[#FFD700]"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setExpanded(
                    expanded === project.id ? null : project.id
                  )}
                  className="rounded-full border px-5 py-2 text-sm font-semibold"
                >
                  {expanded === project.id
                    ? "إخفاء المهام"
                    : "عرض مهام المشروع"}
                </button>

                {expanded === project.id && (
                  <ul className="list-inside list-disc space-y-2 text-sm">
                    {project.tasks.map((task) => (
                      <li key={task}>{task}</li>
                    ))}
                  </ul>
                )}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {section === "deliverables" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">التسليمات والاعتمادات</h3>
          {deliverables.map((item) => (
            <GlassPanel key={item.id}>
              <div className="space-y-3">
                <h4 className="text-lg font-bold">{item.title}</h4>
                <p className="text-sm opacity-70">
                  {item.project}
                </p>
                <GlassCapsule>
                  <span className="text-sm">{item.state}</span>
                </GlassCapsule>
                <p className="text-xs leading-6 opacity-70">
                  اعتماد الملفات وطلب التعديلات سيُفعّلان
                  عند ربط خدمة المشاريع وصلاحيات العميل.
                </p>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <p className="text-center text-xs leading-6 opacity-70">
        المعاينة لا تقدم عروضًا ولا تنشئ عقودًا أو مشاريع
        ولا تسجل عمولات أو تغيّر حالات فعلية.
      </p>
    </div>
  );
}

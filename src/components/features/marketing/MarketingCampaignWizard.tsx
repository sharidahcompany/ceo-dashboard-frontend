// A57_G04_17D_2H_ERROR_HANDLING_ORDER_FIX
// A57_G04_17D_2A_ENTITY_ERROR_DIAGNOSTICS
// A57_G04_17D_2_REAL_CATALOG_PICKER_R1\n"use client";

// A57_G04_17C_CAMPAIGN_WIZARD_R2_20261020
// Local UI prototype only. No persistence or real campaign creation.

import { useEffect, useRef, useState } from "react";
import {
  getFinanceLegalEntities,
} from "@/actions/finance/legal-entity.actions";
import {
  getMarketingCatalogItems,
  type MarketingCatalogItem,
} from "@/actions/marketing/catalog-items.actions";
import { GlassPanel, GlassCapsule } from "@/components/ui/ceo-glass";

const steps = [
  "معلومات الحملة",
  "المواد التسويقية",
  "مسارات التنفيذ",
  "الميزانية والعمولات",
  "المراجعة",
];

const paths = [
  { id: "internal", label: "الفريق الداخلي" },
  { id: "agency", label: "وكالة تسويق" },
  { id: "influencer", label: "مؤثر" },
  { id: "meta", label: "إعلانات Meta" },
  { id: "google", label: "إعلانات Google" },
  { id: "snapchat", label: "إعلانات Snapchat" },
  { id: "tiktok", label: "إعلانات TikTok" },
  { id: "linkedin", label: "إعلانات LinkedIn" },
  { id: "production", label: "إنتاج فيديو وصور" },
];

type Plan = {
  cash: string;
  operator: string;
  fee: string;
  commission: string;
  basis: string;
};

const emptyPlan: Plan = {
  cash: "",
  operator: "",
  fee: "",
  commission: "",
  basis: "revenue",
};

function validMoney(value: string) {
  return /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value) &&
    Number.isSafeInteger(Math.round(Number(value) * 100));
}

function toMinor(value: string) {
  return validMoney(value) ? Math.round(Number(value) * 100) : 0;
}

function formatMoney(minor: number) {
  return (minor / 100).toLocaleString("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function MarketingCampaignWizard() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("sales");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [mode, setMode] = useState("catalog");
  const [entityId, setEntityId] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [entities, setEntities] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [entityError, setEntityError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [items, setItems] = useState<MarketingCatalogItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const catalogRequest = useRef(0);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogLastPage, setCatalogLastPage] = useState(1);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogScope, setCatalogScope] = useState<{
    entity: number; catalog: number
  } | null>(null);
  const [custom, setCustom] = useState("");
  const [mediaType, setMediaType] = useState("video");
  const [production, setProduction] = useState(false);
  const [selected, setSelected] = useState<string[]>(["internal"]);
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const result: unknown = await getFinanceLegalEntities();

        if (!active) return;

        // Check failure BEFORE requiring success-only data.
        if (typeof result !== "object" || result === null) {
          setEntityError("استجابة Finance غير صالحة.");
          return;
        }

        const checked = result as {
          success?: unknown;
          error?: unknown;
          data?: unknown;
        };

        if (checked.success === false) {
          // Do not expose arbitrary server diagnostics to users.
          setEntityError(
            typeof checked.error === "string" &&
            checked.error.trim()
              ? checked.error.slice(0, 200)
              : "تعذر تحميل الكيانات القانونية."
          );
          return;
        }

        if (checked.success !== true || !("data" in checked)) {
          setEntityError("استجابة Finance غير مكتملة.");
          return;
        }

        const top = checked as { data: unknown };
        const rows: unknown = Array.isArray(top.data)
          ? top.data
          : typeof top.data === "object" &&
            top.data !== null &&
            "data" in top.data
            ? (top.data as { data: unknown }).data
            : null;

        if (!Array.isArray(rows)) {
          setEntityError("تعذر تحميل الكيانات القانونية.");
          return;
        }

        const parsed = rows
          .filter((x: unknown) =>
            typeof x === "object" && x !== null &&
            "id" in x && Number.isSafeInteger(x.id) &&
            Number(x.id) > 0 &&
            (!("is_active" in x) || x.is_active !== false))
          .map((x: Record<string, unknown>) => {
            const raw = x.legal_name ?? x.name;
            const name = typeof raw === "string"
              ? raw
              : raw && typeof raw === "object"
                ? String(
                    (raw as Record<string, unknown>).ar ??
                    (raw as Record<string, unknown>).en ??
                    `كيان ${x.id}`
                  )
                : `كيان ${x.id}`;
            return { id: Number(x.id), name };
          });

        setEntities(parsed);
        if (!parsed.length) {
          setEntityError("لا توجد كيانات قانونية متاحة.");
        }
      } catch {
        if (active) setEntityError("تعذر تحميل الكيانات القانونية.");
      }
    })();

    return () => { active = false; };
  }, []);

  function productName(item: MarketingCatalogItem): string {
    if (item.name_localized) return item.name_localized;
    if (typeof item.name === "string") return item.name;
    return item.name?.ar || item.name?.en || `منتج ${item.id}`;
  }

  async function loadProducts(
    entity: number,
    catalog: number,
    page: number,
    search: string,
  ) {
    const request = ++catalogRequest.current;
    setCatalogBusy(true);
    setCatalogError("");

    try {
      const result = await getMarketingCatalogItems({
        legal_entity_id: entity,
        catalog_id: catalog,
        page,
        per_page: 25,
        search,
      });

      if (request !== catalogRequest.current) return;

      if (!result.success) {
        setItems([]);
        setCatalogError(result.error);
        return;
      }

      setItems(result.data.data);
      setCatalogPage(result.data.meta.current_page);
      setCatalogLastPage(Math.max(1, result.data.meta.last_page));
    } catch {
      if (request === catalogRequest.current) {
        setItems([]);
        setCatalogError("تعذر تحميل منتجات الكتالوج.");
      }
    } finally {
      if (request === catalogRequest.current) {
        setCatalogBusy(false);
      }
    }
  }

  function openCatalog() {
    const entity = Number(entityId);
    const catalog = Number(catalogId);

    if (
      !/^[1-9][0-9]*$/.test(entityId) ||
      !/^[1-9][0-9]*$/.test(catalogId) ||
      !Number.isSafeInteger(entity) ||
      !Number.isSafeInteger(catalog)
    ) {
      setCatalogError("اختر الكيان وحدد كتالوجًا صحيحًا.");
      return;
    }

    setSelectedItems([]);
    setItems([]);
    setCatalogScope({ entity, catalog });
    void loadProducts(entity, catalog, 1, "");
  }

  function update(id: string, partial: Partial<Plan>) {
    setPlans(previous => ({
      ...previous,
      [id]: { ...emptyPlan, ...previous[id], ...partial },
    }));
  }

  const total = selected.reduce(
    (sum, id) =>
      sum + toMinor(plans[id]?.cash ?? "") +
      toMinor(plans[id]?.fee ?? ""),
    0,
  );

  function next() {
    setError("");

    if (
      step === 0 &&
      (!name.trim() || !start || !end || end < start)
    ) {
      setError("أدخل اسم الحملة وتواريخ صحيحة.");
      return;
    }

    if (
      step === 1 &&
      (((mode === "catalog" || mode === "both") &&
          (!catalogScope || selectedItems.length === 0)) ||
       ((mode === "custom" || mode === "both") && !custom.trim()))
    ) {
      setError("حدد ما تريد تسويقه.");
      return;
    }

    if (step === 2 && selected.length === 0) {
      setError("اختر مسار تنفيذ واحدًا على الأقل.");
      return;
    }

    if (step === 3 && selected.some(id => {
      const p = plans[id] ?? emptyPlan;
      const commission = Number(p.commission);
      return !validMoney(p.cash) ||
        (p.fee !== "" && !validMoney(p.fee)) ||
        (p.commission !== "" &&
          (!Number.isFinite(commission) ||
           commission <= 0 || commission > 100));
    })) {
      setError("راجع مبالغ الميزانيات والأتعاب ونسب العمولات.");
      return;
    }

    setStep(current => Math.min(4, current + 1));
  }

  const fieldClass = "w-full rounded-xl border bg-transparent p-3";
  const labelClass = "block space-y-2 text-sm";

  return (
    <div dir="rtl" className="space-y-5">
      <GlassPanel>
        <div className="space-y-5">
          <h2 className="text-2xl font-bold">إنشاء حملة جديدة</h2>
          <div className="grid grid-cols-5 gap-1">
            {steps.map((title, index) => (
              <button
                key={title}
                type="button"
                disabled={index > step}
                onClick={() => { setStep(index); setError(""); }}
                aria-current={index === step ? "step" : undefined}
                className="min-w-0 space-y-2 text-center disabled:opacity-50"
              >
                <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  index === step
                    ? "bg-[#FFD700] text-neutral-950"
                    : "border"
                }`}>
                  {index + 1}
                </span>
                <span className="block text-[10px] sm:text-xs">{title}</span>
              </button>
            ))}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel>
        <div className="space-y-5">
          <h3 className="text-xl font-bold">
            {step + 1}. {steps[step]}
          </h3>

          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span>اسم الحملة</span>
                <input className={fieldClass} value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="حملة افتتاح فرع جديد" />
              </label>
              <label className={labelClass}>
                <span>هدف الحملة</span>
                <select className={fieldClass} value={goal}
                  onChange={e => setGoal(e.target.value)}>
                  <option value="sales">زيادة المبيعات</option>
                  <option value="leads">استقطاب عملاء</option>
                  <option value="awareness">التعريف بالمنشأة</option>
                  <option value="engagement">التفاعل</option>
                </select>
              </label>
              <label className={labelClass}>
                <span>تاريخ البداية</span>
                <input type="date" className={fieldClass} value={start}
                  onChange={e => setStart(e.target.value)} />
              </label>
              <label className={labelClass}>
                <span>تاريخ النهاية</span>
                <input type="date" className={fieldClass} value={end}
                  min={start || undefined}
                  onChange={e => setEnd(e.target.value)} />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm opacity-70">
                اختر من الكتالوج، أو أضف مادة تسويقية خارجه، أو اجمع بينهما.
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["catalog", "من الكتالوج"],
                  ["custom", "خارج الكتالوج"],
                  ["both", "الاثنان معًا"],
                ].map(([id, title]) => (
                  <button key={id} type="button"
                    aria-pressed={mode === id}
                    onClick={() => setMode(id)}
                    className={`rounded-xl border p-4 text-sm font-semibold ${
                      mode === id
                        ? "bg-[#FFD700] text-neutral-950"
                        : ""
                    }`}>
                    {title}
                  </button>
                ))}
              </div>

              {(mode === "catalog" || mode === "both") && (
                <section className="space-y-4 rounded-xl border p-4">
                  <h4 className="font-bold">اختيار المنتجات الفعلية</h4>

                  <label className={labelClass}>
                    <span>الكيان القانوني</span>
                    <select
                      className={fieldClass}
                      value={entityId}
                      onChange={e => {
                        catalogRequest.current++;
                        setEntityId(e.target.value);
                        setCatalogScope(null);
                        setItems([]);
                        setSelectedItems([]);
                      }}
                    >
                      <option value="">اختر الكيان القانوني</option>
                      {entities.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {entityError && (
                    <p role="alert" className="text-sm">
                      {entityError}
                    </p>
                  )}

                  <label className={labelClass}>
                    <span>معرف الكتالوج — مؤقت حتى ربط قائمة الكتالوجات</span>
                    <input
                      inputMode="numeric"
                      className={fieldClass}
                      value={catalogId}
                      onChange={e => {
                        catalogRequest.current++;
                        setCatalogId(e.target.value);
                        setCatalogScope(null);
                        setItems([]);
                        setSelectedItems([]);
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    disabled={catalogBusy || !entityId || !catalogId}
                    className="rounded-full border px-5 py-3 text-sm disabled:opacity-50"
                    onClick={openCatalog}
                  >
                    {catalogBusy ? "جارٍ التحميل..." : "عرض منتجات الكتالوج"}
                  </button>

                  {catalogError && (
                    <p role="alert" className="text-sm">
                      {catalogError}
                    </p>
                  )}

                  {catalogScope && (
                    <>
                      <label className={labelClass}>
                        <span>بحث في المنتجات</span>
                        <input
                          className={fieldClass}
                          value={catalogSearch}
                          onChange={e => setCatalogSearch(e.target.value)}
                          placeholder="اسم المنتج أو الخدمة"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={catalogBusy}
                        className="rounded-full border px-5 py-2 text-sm"
                        onClick={() => void loadProducts(
                          catalogScope.entity,
                          catalogScope.catalog,
                          1,
                          catalogSearch.trim()
                        )}
                      >
                        بحث
                      </button>

                      <p className="text-sm opacity-70">
                        المنتجات المحددة: {selectedItems.length}
                      </p>

                      {items.map(item => (
                        <label
                          key={item.id}
                          className="flex items-center gap-3 rounded-xl border p-3"
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={e => setSelectedItems(old =>
                              e.target.checked
                                ? [...new Set([...old, item.id])]
                                : old.filter(id => id !== item.id)
                            )}
                          />
                          <span className="text-sm">
                            {productName(item)}
                          </span>
                        </label>
                      ))}

                      {catalogLastPage > 1 && (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={catalogBusy || catalogPage <= 1}
                            onClick={() => void loadProducts(
                              catalogScope.entity,
                              catalogScope.catalog,
                              catalogPage - 1,
                              catalogSearch.trim()
                            )}
                            className="rounded-full border px-4 py-2 text-sm disabled:opacity-40"
                          >
                            السابق
                          </button>
                          <span className="text-sm">
                            {catalogPage} / {catalogLastPage}
                          </span>
                          <button
                            type="button"
                            disabled={
                              catalogBusy ||
                              catalogPage >= catalogLastPage
                            }
                            onClick={() => void loadProducts(
                              catalogScope.entity,
                              catalogScope.catalog,
                              catalogPage + 1,
                              catalogSearch.trim()
                            )}
                            className="rounded-full border px-4 py-2 text-sm disabled:opacity-40"
                          >
                            التالي
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}

              {(mode === "custom" || mode === "both") && (
                <>
                  <label className={labelClass}>
                    <span>اسم ووصف المادة التسويقية المخصصة</span>
                    <textarea className={fieldClass} rows={3}
                      value={custom}
                      onChange={e => setCustom(e.target.value)}
                      placeholder="مثل فيديو تعريفي أو إعلان افتتاح" />
                  </label>
                  <label className={labelClass}>
                    <span>نوع المادة</span>
                    <select className={fieldClass} value={mediaType}
                      onChange={e => setMediaType(e.target.value)}>
                      <option value="video">فيديو</option>
                      <option value="images">صور</option>
                      <option value="both">فيديو وصور</option>
                      <option value="other">أخرى</option>
                    </select>
                  </label>
                </>
              )}

              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={production}
                  onChange={e => setProduction(e.target.checked)} />
                تحتاج هذه الحملة إلى طلب إنتاج؟
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm opacity-70">
                اختر مسارًا واحدًا أو عدة مسارات. يمكن تفويض
                تشغيل الحسابات الإعلانية لفريق داخلي أو وكالة خارجية.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {paths.map(path => (
                  <label key={path.id}
                    className="flex items-center gap-3 rounded-xl border p-4">
                    <input type="checkbox"
                      checked={selected.includes(path.id)}
                      onChange={() => setSelected(previous =>
                        previous.includes(path.id)
                          ? previous.filter(id => id !== path.id)
                          : [...previous, path.id],
                      )} />
                    <span className="text-sm font-medium">{path.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm opacity-70">
                المبلغ النقدي والأتعاب الثابتة والنسبة
                تسجل بصورة منفصلة لكل مسار.
              </p>
              {paths.filter(p => selected.includes(p.id)).map(path => {
                const p = plans[path.id] ?? emptyPlan;
                return (
                  <div key={path.id} className="space-y-4 rounded-xl border p-4">
                    <h4 className="font-bold">{path.label}</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className={labelClass}>
                        <span>مخصص المسار النقدي (ريال)</span>
                        <input inputMode="decimal" className={fieldClass}
                          value={p.cash} placeholder="0.00"
                          onChange={e => update(path.id, { cash: e.target.value })} />
                      </label>
                      <label className={labelClass}>
                        <span>الجهة المنفذة</span>
                        <select className={fieldClass} value={p.operator}
                          onChange={e => update(path.id, { operator: e.target.value })}>
                          <option value="">تحدد لاحقًا</option>
                          <option value="internal">فريق داخلي</option>
                          <option value="agency">وكالة خارجية</option>
                          <option value="influencer">مؤثر</option>
                        </select>
                      </label>
                      <label className={labelClass}>
                        <span>أتعاب ثابتة إضافية (ريال)</span>
                        <input inputMode="decimal" className={fieldClass}
                          value={p.fee} placeholder="اختياري"
                          onChange={e => update(path.id, { fee: e.target.value })} />
                      </label>
                      <label className={labelClass}>
                        <span>عمولة على النتائج (%)</span>
                        <input inputMode="decimal" className={fieldClass}
                          value={p.commission} placeholder="اختياري"
                          onChange={e => update(path.id, {
                            commission: e.target.value,
                          })} />
                      </label>
                      {p.commission !== "" && (
                        <label className={labelClass}>
                          <span>أساس احتساب العمولة</span>
                          <select className={fieldClass} value={p.basis}
                            onChange={e => update(path.id, { basis: e.target.value })}>
                            <option value="revenue">الإيرادات المنسوبة</option>
                            <option value="sales">المبيعات</option>
                            <option value="result">نتيجة متفق عليها</option>
                          </select>
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
              <GlassCapsule>
                <p className="text-sm opacity-70">
                  إجمالي المخصصات والأتعاب النقدية المخططة
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatMoney(total)} ريال
                </p>
              </GlassCapsule>
              <p className="text-xs opacity-70">
                لا يتضمن الإجمالي العمولات النسبية غير المستحقة.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-sm">
              <h4 className="text-lg font-bold">{name}</h4>
              <p>الهدف: {goal}</p>
              <p>الفترة: {start} — {end}</p>
              <p>
                المحتوى: {mode === "both"
                  ? "الكتالوج ومادة مخصصة"
                  : mode === "catalog" ? "الكتالوج" : "مادة مخصصة"}
              </p>
              <p>طلب إنتاج: {production ? "نعم" : "لا"}</p>
              {(mode === "catalog" || mode === "both") && (
                <p>
                  المنتجات المحددة من الكتالوج: {selectedItems.length}
                </p>
              )}
              {paths.filter(p => selected.includes(p.id)).map(path => (
                <div key={path.id} className="rounded-xl border p-3">
                  <strong>{path.label}</strong>
                  <p>
                    المخصص: {formatMoney(toMinor(plans[path.id]?.cash ?? ""))} ريال
                  </p>
                  <p>
                    الأتعاب الثابتة: {formatMoney(toMinor(plans[path.id]?.fee ?? ""))} ريال
                  </p>
                  {plans[path.id]?.commission && (
                    <p>نسبة العمولة: {plans[path.id].commission}%</p>
                  )}
                </div>
              ))}
              <p className="text-lg font-bold">
                إجمالي النقد المخطط: {formatMoney(total)} ريال
              </p>
              <div role="status" className="rounded-xl border p-4 leading-7">
                هذه معاينة للحملة فقط. لم يتم إنشاء حملة أو
                حفظ ميزانية أو تقديم طلب إنتاج.
                التفعيل الحقيقي يتطلب ربط البيانات بعقود آمنة.
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl border p-3 text-sm">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 border-t pt-5">
            <button type="button" disabled={step === 0}
              className="rounded-full border px-6 py-3 text-sm disabled:opacity-40"
              onClick={() => { setStep(s => Math.max(0, s - 1)); setError(""); }}>
              السابق
            </button>
            {step < 4 ? (
              <button type="button"
                className="rounded-full bg-[#FFD700] px-7 py-3 text-sm font-bold text-neutral-950"
                onClick={next}>
                التالي ←
              </button>
            ) : (
              <span className="text-xs opacity-70">
                المعاينة فقط — الحفظ غير مفعل
              </span>
            )}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

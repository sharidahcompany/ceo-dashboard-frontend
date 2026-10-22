// A57_G04_15_MARKETING_GLASS_FORMS_R1_20261020
// Presentation-only glass refinement.
// Business logic and server actions unchanged.
"use client";

import { useRef, useState } from "react";
import {
  createMarketingCampaign,
  type CreateMarketingCampaignInput,
} from "@/actions/marketing/create-campaign.actions";
import {
  getMarketingCatalogItems,
  type MarketingCatalogItem,
} from "@/actions/marketing/catalog-items.actions";

type SelectionMode = "specific" | "all";

type SelectionDraft =
  | {
      mode: "specific";
      legal_entity_id: number;
      catalog_id: number;
      item_ids: number[];
    }
  | {
      mode: "all";
      legal_entity_id: number;
      catalog_id: number;
    };

const PER_PAGE = 25;

function productName(item: MarketingCatalogItem): string {
  if (item.name_localized) return item.name_localized;

  if (typeof item.name === "string") return item.name;

  return item.name?.ar || item.name?.en || `منتج ${item.id}`;
}

export default function MarketingProductSelector() {
  const [entityInput, setEntityInput] = useState("");
  const [catalogInput, setCatalogInput] = useState("");
  const [scope, setScope] = useState<{
    entityId: number;
    catalogId: number;
  } | null>(null);

  const [items, setItems] = useState<MarketingCatalogItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [mode, setMode] = useState<SelectionMode>("specific");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  // A57_G04_12_CAMPAIGN_FORM — local-only draft.
  const [campaignCode, setCampaignCode] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [campaignSubmitting, setCampaignSubmitting] = useState(false);

  // A57_G04_12_F9_ACTION_BINDING
  async function submitCampaign(input: CreateMarketingCampaignInput) {
    if (campaignSubmitting) return;

    setCampaignSubmitting(true);
    setCampaignMessage("");

    try {
      const result = await createMarketingCampaign(input);
      setCampaignMessage(
        result.success
          ? `تم إنشاء الحملة بنجاح. المعرف: ${result.campaignId}`
          : result.error
      );
    } catch {
      setCampaignMessage("تعذر تنفيذ الطلب.");
    } finally {
      setCampaignSubmitting(false);
    }
  }


  async function load(
    entityId: number,
    catalogId: number,
    nextPage: number,
    searchTerm: string,
  ) {
    const currentRequest = ++requestId.current;

    setLoading(true);
    setError("");

    try {
      const result = await getMarketingCatalogItems({
        legal_entity_id: entityId,
        catalog_id: catalogId,
        page: nextPage,
        per_page: PER_PAGE,
        search: searchTerm,
      });

      // Ignore responses from older catalog/page requests.
      if (currentRequest !== requestId.current) return;

      if (!result.success) {
        setItems([]);
        setTotal(0);
        setLastPage(1);
        setError(result.error);
        return;
      }

      setItems(result.data.data);
      setPage(result.data.meta.current_page);
      setLastPage(Math.max(1, result.data.meta.last_page));
      setTotal(result.data.meta.total);
    } catch {
      if (currentRequest === requestId.current) {
        setItems([]);
        setTotal(0);
        setLastPage(1);
        setError("تعذر تحميل منتجات الكتالوج.");
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }

  function changePage(nextPage: number) {
    if (!scope || loading || nextPage < 1 || nextPage > lastPage) {
      return;
    }

    void load(scope.entityId, scope.catalogId, nextPage, appliedSearch);
  }

  function openCatalog() {
    const entityId = Number(entityInput);
    const catalogId = Number(catalogInput);

    if (
      !Number.isSafeInteger(entityId) ||
      !Number.isSafeInteger(catalogId) ||
      entityId < 1 ||
      catalogId < 1
    ) {
      setError("أدخل معرف الكيان القانوني والكتالوج بصورة صحيحة.");
      return;
    }

    setItems([]);
    setSelectedIds([]);
    setMode("specific");
    setFilter("");
    setAppliedSearch("");
    setPage(1);
    setTotal(0);
    setLastPage(1);
    setError("");

    setScope({ entityId, catalogId });
    void load(entityId, catalogId, 1, "");
  }

  function applySearch() {
    if (!scope || loading) return;
    const term = filter.trim();
    setAppliedSearch(term);
    setPage(1);
    void load(scope.entityId, scope.catalogId, 1, term);
  }

  function toggle(id: number, checked: boolean) {
    setSelectedIds((previous) => checked
      ? [...new Set([...previous, id])]
      : previous.filter((value) => value !== id),
    );
  }


  const draft: SelectionDraft | null = scope
    ? mode === "all"
      ? {
          mode: "all",
          legal_entity_id: scope.entityId,
          catalog_id: scope.catalogId,
        }
      : {
          mode: "specific",
          legal_entity_id: scope.entityId,
          catalog_id: scope.catalogId,
          item_ids: selectedIds,
        }
    : null;

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-5xl space-y-6 p-6"
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          التسويق 360 — اختيار منتجات الحملة
        </h1>
        <p className="text-sm text-muted-foreground">
          اختر المنتجات من كتالوج المنشأة في Finance دون إنشاء
          نسخة ثانية من بياناتها.
        </p>
      </header>

      <section className="space-y-4 rounded-[3rem] border border-white/70 bg-white/55 p-6 shadow-lg shadow-neutral-900/5 backdrop-blur-xl">
        <h2 className="font-semibold">نطاق الكتالوج</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span>معرف الكيان القانوني</span>
            <input
              type="number"
              min="1"
              value={entityInput}
              onChange={(event) => setEntityInput(event.target.value)}
              className="w-full rounded-full border border-white/70 bg-white/70 shadow-sm backdrop-blur-md p-2"
              placeholder="Legal Entity ID"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span>معرف الكتالوج</span>
            <input
              type="number"
              min="1"
              value={catalogInput}
              onChange={(event) => setCatalogInput(event.target.value)}
              className="w-full rounded-full border border-white/70 bg-white/70 shadow-sm backdrop-blur-md p-2"
              placeholder="Catalog ID"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={openCatalog}
          className="rounded-full bg-[#FFD700] px-4 py-2 text-neutral-950"
        >
          تحميل المنتجات المصرح بها
        </button>

        <p className="text-xs text-muted-foreground">
          هذه مرحلة ربط أولية بالمعرفات. اختيار الكيان والكتالوج
          من قوائم مصرح بها سيضاف ضمن تكامل إعداد الحملات.
        </p>
      </section>

      {error && (
        <p role="alert" className="rounded-full border border-white/70 bg-white/55 p-4 backdrop-blur-xl text-destructive">
          {error}
        </p>
      )}

      {scope && (
        <section className="space-y-4 rounded-[3rem] border border-white/70 bg-white/55 p-6 shadow-lg shadow-neutral-900/5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">منتجات الكتالوج</h2>
              <p className="text-sm text-muted-foreground">
                العدد الإجمالي: {total}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="marketing-selection-mode"
                  checked={mode === "specific"}
                  onChange={() => setMode("specific")}
                />
                منتجات محددة
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="marketing-selection-mode"
                  checked={mode === "all"}
                  onChange={() => setMode("all")}
                />
                جميع منتجات الكتالوج
              </label>
            </div>
          </div>

          {mode === "all" ? (
            <p className="rounded-full border p-4 text-sm">
              تم اختيار نطاق الكتالوج بالكامل. هذا الاختيار
              لا يقتصر على الصفحة الحالية. ستتم إعادة التحقق
              من المنتجات والصلاحيات عند إنشاء الحملة فعليًا.
            </p>
          ) : (
            <>
              <label className="block space-y-2 text-sm">
                <span>بحث في جميع منتجات الكتالوج</span>
                <input
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="w-full rounded-full border border-white/70 bg-white/70 shadow-sm backdrop-blur-md p-2"
                  placeholder="اسم المنتج أو رمزه"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") applySearch();
                  }}
                />
              </label>
              <button
                type="button"
                onClick={applySearch}
                disabled={loading}
                className="rounded-full border px-4 py-2 disabled:opacity-50"
              >
                بحث في الكتالوج
              </button>

              {loading ? (
                <p role="status">جارٍ تحميل المنتجات...</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  لا توجد منتجات مطابقة للبحث في الكتالوج.
                </p>
              ) : (
                <div className="divide-y rounded-full border">
                  {items.map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-center gap-4 p-3"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(event) =>
                          toggle(item.id, event.target.checked)
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {productName(item)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.sku || `#${item.id}`}
                          {" · "}
                          {item.catalog_type}
                        </p>
                      </div>
                      <span className="text-sm">
                        {item.unit_price ?? "—"}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <p className="text-sm">
                المنتجات المحددة عبر الصفحات: {selectedIds.length}
              </p>
            </>
          )}

          <div className="flex items-center justify-between gap-4 text-sm">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => changePage(page - 1)}
              className="rounded-full border px-3 py-2 disabled:opacity-50"
            >
              السابق
            </button>

            <span>
              الصفحة {page} من {lastPage}
            </span>

            <button
              type="button"
              disabled={loading || page >= lastPage}
              onClick={() => changePage(page + 1)}
              className="rounded-full border px-3 py-2 disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        </section>
      )}

      {draft && (
        <section className="space-y-3 rounded-[3rem] border border-white/70 bg-white/55 p-6 shadow-lg shadow-neutral-900/5 backdrop-blur-xl">
          <h2 className="font-semibold">ملخص اختيار الحملة</h2>

            <button
              type="button"
              disabled={
                campaignSubmitting ||
                !campaignCode.trim() ||
                !campaignName.trim() ||
                !campaignObjective.trim() ||
                (draft.mode === "specific" && draft.item_ids.length === 0)
              }
              onClick={() => void submitCampaign({
                legal_entity_id: draft.legal_entity_id,
                catalog_id: draft.catalog_id,
                selection_mode: draft.mode,
                ...(draft.mode === "specific"
                  ? { item_ids: draft.item_ids }
                  : {}),
                campaign_code: campaignCode.trim(),
                name: campaignName.trim(),
                objective: campaignObjective.trim(),
              })}
              className="rounded-full border px-4 py-2 disabled:opacity-50"
            >
              {campaignSubmitting
                ? "جارٍ التحقق..."
                : "التحقق من طلب إنشاء الحملة"}
            </button>

            {campaignMessage && (
              <p role="status" className="text-sm">
                {campaignMessage}
              </p>
            )}


            <div className="grid gap-4">
              <label className="space-y-2 text-sm">
                <span>رمز الحملة</span>
                <input
                  type="text"
                  maxLength={80}
                  value={campaignCode}
                  onChange={(e) => setCampaignCode(e.target.value)}
                  className="w-full rounded-full border border-white/70 bg-white/70 shadow-sm backdrop-blur-md p-2"
                  placeholder="CAMPAIGN-2026-001"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span>اسم الحملة</span>
                <input
                  type="text"
                  maxLength={200}
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full rounded-full border border-white/70 bg-white/70 shadow-sm backdrop-blur-md p-2"
                  placeholder="الحملة التسويقية"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span>الهدف التسويقي</span>
                <textarea
                  maxLength={1000}
                  value={campaignObjective}
                  onChange={(e) => setCampaignObjective(e.target.value)}
                  className="w-full rounded-full border border-white/70 bg-white/70 shadow-sm backdrop-blur-md p-2"
                  placeholder="ما النتائج المراد تحقيقها؟"
                />
              </label>
            </div>

            <p className="text-xs text-muted-foreground">
              يُرسل طلب الإنشاء إلى الخدمة عند اعتماد بيئة التشغيل. الإنشاء مغلق افتراضيًا.
            </p>

          <pre
            dir="ltr"
            className="overflow-x-auto rounded-full bg-muted p-4 text-xs"
          >
            {JSON.stringify({
                  legal_entity_id: draft.legal_entity_id,
                  catalog_id: draft.catalog_id,
                  selection_mode: draft.mode,
                  ...(draft.mode === "specific"
                    ? { item_ids: draft.item_ids }
                    : {}),
                  campaign_code: campaignCode.trim(),
                  name: campaignName.trim(),
                  objective: campaignObjective.trim(),
                }, null, 2)}
          </pre>
          <p className="text-xs text-muted-foreground">
            هذه معاينة للبيانات التي سيستخدمها طلب إنشاء الحملة.
            المعاينة وحدها لا تنشئ حملة؛ تظهر نتيجة التنفيذ بعد الضغط على زر التحقق.
          </p>
        </section>
      )}
    </main>
  );
}

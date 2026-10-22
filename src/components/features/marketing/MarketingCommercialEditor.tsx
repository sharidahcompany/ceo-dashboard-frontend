// A57_G04_15_MARKETING_GLASS_FORMS_R1_20261020
// Presentation-only glass refinement.
// Business logic and server actions unchanged.
"use client";

import { useState } from "react";
import {
  readMarketingCommercialPlan,
} from "@/actions/marketing/read-commercial-plan.actions";
import {
  saveMarketingCommercialPlan,
  type CommercialAgreement,
} from "@/actions/marketing/save-commercial-plan.actions";

type AllocationRow = {
  id: number;
  channel: string;
  amount: string;
};

const field =
  "w-full rounded-full border border-white/70 bg-white/70 shadow-sm backdrop-blur-md px-3 py-2 text-sm";

const smallButton =
  "rounded-full border px-3 py-2 text-sm hover:bg-[#FFD700]/15";

function validMinor(value: string): boolean {
  return /^(0|[1-9][0-9]{0,17})$/.test(value);
}

export default function MarketingCommercialEditor() {
  const [campaignId, setCampaignId] = useState("");
  const [legalEntity, setLegalEntity] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [total, setTotal] = useState("0");
  const [revision, setRevision] = useState(0);
  const [rows, setRows] = useState<AllocationRow[]>([]);
  const [agreements, setAgreements] = useState<CommercialAgreement[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [nextId, setNextId] = useState(1);

  function edit() {
    setDirty(true);
    setMessage("");
  }

  function validScope(): number | null {
    const id = Number(legalEntity);
    return Number.isSafeInteger(id) && id > 0 &&
      /^[A-Za-z0-9_-]{1,64}$/.test(campaignId)
      ? id : null;
  }

  async function load() {
    const entity = validScope();
    if (!entity) {
      setMessage("أدخل معرف حملة وكيان قانوني صحيحين.");
      return;
    }

    if (dirty && !window.confirm(
      "سيتم تجاهل التعديلات غير المحفوظة. هل تريد المتابعة؟"
    )) return;

    setBusy(true);
    setMessage("");
    setLoaded(false);
    setDirty(false);

    try {
      const result = await readMarketingCommercialPlan(campaignId, entity);

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setCurrency(result.data.currency);
      setTotal(result.data.total_minor);
      setRevision(result.data.revision);

      const entries = Object.entries(result.data.allocations)
        .map(([channel, amount], index) => ({
          id: index + 1,
          channel,
          amount,
        }));

      setRows(entries);
      setNextId(entries.length + 1);
      setAgreements(
        result.data.agreements as unknown as CommercialAgreement[]
      );
      setLoaded(true);
      setMessage(`تم تحميل المراجعة ${result.data.revision}.`);
    } catch {
      setMessage("تعذر تحميل الخطة التجارية.");
    } finally {
      setBusy(false);
    }
  }

  function newDraft() {
    if (dirty && !window.confirm(
      "سيتم تجاهل التعديلات الحالية. هل تريد المتابعة؟"
    )) return;

    setCurrency("SAR");
    setTotal("0");
    setRevision(0);
    setRows([]);
    setAgreements([]);
    setLoaded(true);
    setDirty(false);
    setNextId(1);
    setMessage("مسودة جديدة: لم تُحفظ بعد.");
  }

  function updateRow(id: number, patch: Partial<AllocationRow>) {
    setRows((old) => old.map((r) =>
      r.id === id ? { ...r, ...patch } : r
    ));
    edit();
  }

  function updateAgreement(
    index: number, patch: Partial<CommercialAgreement>
  ) {
    setAgreements((old) => old.map((r, i) =>
      i === index ? { ...r, ...patch } : r
    ));
    edit();
  }

  function addAgreement() {
    setAgreements((old) => [...old, {
      beneficiary_id: "",
      beneficiary_type: "influencer",
      compensation_type: "fixed",
      currency,
      fixed_minor: "0",
      rate_basis_points: 0,
      percentage_basis: null,
      earning_condition: "",
      commission_cap_minor: null,
    }]);
    edit();
  }

  async function persist() {
    const entity = validScope();

    if (!loaded || entity === null) {
      setMessage("حدد حملة صالحة وافتح مسودة أو حمّل خطة.");
      return;
    }

    const allocations: Record<string, string> = {};
    let sum = BigInt(0);

    for (const row of rows) {
      if (
        !/^[A-Za-z0-9_-]{1,100}$/.test(row.channel) ||
        !validMinor(row.amount) ||
        BigInt(row.amount) <= BigInt(0) ||
        Object.prototype.hasOwnProperty.call(allocations, row.channel)
      ) {
        setMessage("يجب أن يكون لكل قناة مفتاح فريد ومبلغ أكبر من صفر.");
        return;
      }
      allocations[row.channel] = row.amount;
      sum += BigInt(row.amount);
    }

    if (!validMinor(total) || sum !== BigInt(total)) {
      setMessage("مجموع توزيعات القنوات يجب أن يساوي الميزانية.");
      return;
    }

    if (agreements.some((a) =>
      !a.earning_condition?.trim() ||
      (a.compensation_type === "fixed" &&
        (!validMinor(a.fixed_minor) ||
          BigInt(a.fixed_minor) <= BigInt(0)))
    )) {
      setMessage("أكمل شرط الاستحقاق، وحدد أتعابًا ثابتة موجبة للاتفاق الثابت.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const result = await saveMarketingCommercialPlan({
        campaign_id: campaignId,
        legal_entity_id: entity,
        currency,
        total_minor: total,
        allocations,
        agreements: agreements.map((a) => ({
          ...a,
          currency,
        })),
        expected_revision: revision,
      });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setRevision(result.revision);
      setDirty(false);
      setMessage(
        `تم تأكيد الحفظ في الخادم. المراجعة الجديدة: ${result.revision}.`
      );
    } catch {
      setMessage("تعذر تأكيد عملية الحفظ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="mx-auto max-w-6xl space-y-5 p-6">
      <header>
        <h1 className="text-2xl font-bold">
          ميزانية الحملة واتفاقات التسويق
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          إدارة المخصصات النقدية والاتفاقات دون إنشاء قيود مالية
          أو الموافقة على الصرف.
        </p>
      </header>

      <section className="grid gap-3 rounded-[3rem] border border-white/70 bg-white/55 p-6 shadow-lg shadow-neutral-900/5 backdrop-blur-xl sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>معرف الحملة</span>
          <input className={field} value={campaignId}
            disabled={busy || loaded}
            onChange={(e) => setCampaignId(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span>معرف الكيان القانوني</span>
          <input className={field} value={legalEntity}
            disabled={busy || loaded} inputMode="numeric"
            onChange={(e) => setLegalEntity(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button className={smallButton} disabled={busy}
            onClick={() => { setLoaded(false); setDirty(false); setMessage(""); }}
            type="button">تغيير الحملة</button>
          <button className={smallButton} disabled={busy}
            onClick={() => void load()} type="button">
            تحميل الخطة المحفوظة
          </button>
          <button className={smallButton} disabled={busy}
            onClick={newDraft} type="button">
            إنشاء مسودة جديدة
          </button>
        </div>
      </section>

      {loaded && (
        <>
          <section className="space-y-3 rounded-[3rem] border border-white/70 bg-white/55 p-6 shadow-lg shadow-neutral-900/5 backdrop-blur-xl">
            <h2 className="font-semibold">
              الميزانية النقدية — المراجعة {revision}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>العملة</span>
                <input className={field} value={currency}
                  maxLength={3} onChange={(e) => {
                    setCurrency(e.target.value.toUpperCase());
                    edit();
                  }} />
              </label>
              <label className="space-y-1 text-sm">
                <span>إجمالي الميزانية بالوحدات الصغرى</span>
                <input className={field} value={total}
                  inputMode="numeric"
                  onChange={(e) => { setTotal(e.target.value); edit(); }} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              مثال: 10000 هللة = 100 ريال. لا تُدخل الكسور في هذا الحقل.
            </p>
            <h3 className="font-medium">توزيع الميزانية حسب القناة</h3>
            {rows.map((row) => (
              <div key={row.id}
                className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input className={field} value={row.channel}
                  aria-label="مفتاح القناة"
                  onChange={(e) => updateRow(row.id, {
                    channel: e.target.value
                  })} placeholder="google_ads" />
                <input className={field} value={row.amount}
                  inputMode="numeric" aria-label="مبلغ القناة"
                  onChange={(e) => updateRow(row.id, {
                    amount: e.target.value
                  })} />
                <button type="button" className={smallButton}
                  onClick={() => {
                    setRows((old) => old.filter((r) => r.id !== row.id));
                    edit();
                  }}>حذف</button>
              </div>
            ))}
            <button type="button" className={smallButton}
              onClick={() => {
                setRows((old) => [...old, {
                  id: nextId, channel: "", amount: "0"
                }]);
                setNextId((v) => v + 1);
                edit();
              }}>+ إضافة قناة</button>
          </section>

          <section className="space-y-3 rounded-[3rem] border border-white/70 bg-white/55 p-6 shadow-lg shadow-neutral-900/5 backdrop-blur-xl">
            <h2 className="font-semibold">اتفاقات المستفيدين</h2>
            {agreements.map((a, index) => (
              <div key={index}
                className="grid gap-3 rounded-full border border-white/70 bg-white/55 p-4 backdrop-blur-xl sm:grid-cols-2">
                <label className="space-y-1 text-xs">
                  <span>معرف المستفيد</span>
                  <input className={field} value={a.beneficiary_id}
                    onChange={(e) => updateAgreement(index, {
                      beneficiary_id: e.target.value
                    })} />
                </label>
                <label className="space-y-1 text-xs">
                  <span>نوع المستفيد</span>
                  <select className={field} value={a.beneficiary_type}
                    onChange={(e) => updateAgreement(index, {
                      beneficiary_type: e.target.value
                    })}>
                    <option value="employee">موظف</option>
                    <option value="marketing_agency">وكالة تسويق</option>
                    <option value="influencer">مؤثر</option>
                    <option value="external_partner">شريك خارجي</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs">
                  <span>نوع التعويض</span>
                  <select className={field} value={a.compensation_type}
                    onChange={(e) => updateAgreement(index, {
                      compensation_type:
                        e.target.value as CommercialAgreement["compensation_type"]
                    })}>
                    <option value="fixed">ثابت</option>
                    <option value="percentage">نسبة</option>
                    <option value="mixed">ثابت ونسبة</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs">
                  <span>الأتعاب الثابتة بالوحدات الصغرى</span>
                  <input className={field} value={a.fixed_minor}
                    onChange={(e) => updateAgreement(index, {
                      fixed_minor: e.target.value
                    })} />
                </label>
                <label className="space-y-1 text-xs">
                  <span>النسبة بالنقاط الأساسية (100 = 1%)</span>
                  <input className={field} type="number"
                    min={0} max={10000}
                    value={a.rate_basis_points}
                    onChange={(e) => updateAgreement(index, {
                      rate_basis_points: Number(e.target.value)
                    })} />
                </label>
                <label className="space-y-1 text-xs">
                  <span>أساس احتساب النسبة</span>
                  <input className={field} value={a.percentage_basis ?? ""}
                    onChange={(e) => updateAgreement(index, {
                      percentage_basis: e.target.value || null
                    })} />
                </label>
                <label className="space-y-1 text-xs">
                  <span>شرط الاستحقاق (إلزامي، بحد أقصى 40 حرفًا)</span>
                  <input className={field} maxLength={40}
                    required value={a.earning_condition}
                    onChange={(e) => updateAgreement(index, {
                      earning_condition: e.target.value
                    })} />
                </label>
                <label className="space-y-1 text-xs">
                  <span>سقف العمولة بالوحدات الصغرى</span>
                  <input className={field}
                    value={a.commission_cap_minor ?? ""}
                    onChange={(e) => updateAgreement(index, {
                      commission_cap_minor: e.target.value || null
                    })} />
                </label>
                <button type="button" className={smallButton}
                  onClick={() => {
                    setAgreements((old) =>
                      old.filter((_, i) => i !== index)
                    );
                    edit();
                  }}>حذف الاتفاق</button>
              </div>
            ))}
            <button type="button" className={smallButton}
              onClick={addAgreement}>+ إضافة اتفاق</button>
          </section>

          <section className="flex flex-wrap items-center gap-3 rounded-[3rem] border border-white/70 bg-white/55 p-6 shadow-lg shadow-neutral-900/5 backdrop-blur-xl">
            <button type="button" disabled={busy || !dirty}
              onClick={() => void persist()}
              className="rounded-full bg-[#FFD700] px-5 py-3 text-sm text-neutral-950 disabled:opacity-50">
              {busy ? "جارٍ التنفيذ..." : "حفظ الخطة التجارية"}
            </button>
            <span className="text-xs text-muted-foreground">
              {dirty ? "تعديلات غير محفوظة" : "لا توجد تعديلات معلقة"}
            </span>
          </section>
        </>
      )}

      {message && (
        <p role="status" aria-live="polite"
          className="rounded-full border border-white/70 bg-white/55 p-4 backdrop-blur-xl text-sm">
          {message}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        الحفظ الفعلي مشروط بموافقة Auth V2 وتهيئة Marketing المعزولة.
        لا يُعد نجاح عرض هذه الواجهة موافقة على نشر الخدمة.
      </p>
    </main>
  );
}

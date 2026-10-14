"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  Calculator,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

type Tier = {
  min: number;
  max: number | null;
  unit_monthly_minor: number;
};

type Rates = {
  base_monthly_minor: number;
  rightsholder_monthly_minor: number;
  listed_million_shares_monthly_minor: number;
  investment_unit_monthly_minor: number;
  annual_discount_percent: number;
};

const defaultRates: Rates = {
  base_monthly_minor: 30000,
  rightsholder_monthly_minor: 1000,
  listed_million_shares_monthly_minor: 30000,
  investment_unit_monthly_minor: 0,
  annual_discount_percent: 20,
};

const defaultTiers: Tier[] = [
  { min: 1, max: 3, unit_monthly_minor: 5000 },
  { min: 4, max: 10, unit_monthly_minor: 4000 },
  { min: 11, max: 30, unit_monthly_minor: 3500 },
  { min: 31, max: 60, unit_monthly_minor: 3000 },
  { min: 61, max: 100, unit_monthly_minor: 2500 },
  { min: 101, max: 200, unit_monthly_minor: 2000 },
  { min: 201, max: 400, unit_monthly_minor: 1750 },
  { min: 401, max: 800, unit_monthly_minor: 1500 },
  { min: 801, max: 1600, unit_monthly_minor: 1250 },
  { min: 1601, max: 3200, unit_monthly_minor: 1000 },
  { min: 3201, max: 6400, unit_monthly_minor: 750 },
  { min: 6401, max: 12800, unit_monthly_minor: 500 },
  { min: 12801, max: null, unit_monthly_minor: 250 },
];

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

const numeric = (value: number) =>
  Number.isFinite(value) && Number.isSafeInteger(value) && value >= 0;

export default function PlatformPricingEditor() {
  const [rates, setRates] = useState<Rates>({ ...defaultRates });
  const [tiers, setTiers] = useState<Tier[]>(
    defaultTiers.map((tier) => ({ ...tier }))
  );

  const [seats, setSeats] = useState(25);
  const [rights, setRights] = useState(5);
  const [issuedShares, setIssuedShares] = useState(1000000);
  const [listed, setListed] = useState(false);
  const [annual, setAnnual] = useState(true);

  const fields: {
    key: keyof Rates;
    label: string;
    description: string;
    annualField?: boolean;
  }[] = [
    {
      key: "base_monthly_minor",
      label: "الاشتراك الأساسي",
      description: "رسوم المنشأة شهريًا",
    },
    {
      key: "rightsholder_monthly_minor",
      label: "صاحب الحق",
      description: "القيمة الشهرية لكل صاحب حق",
    },
    {
      key: "listed_million_shares_monthly_minor",
      label: "مليون سهم مُصدر",
      description: "للشركات المساهمة المدرجة",
    },
    {
      key: "investment_unit_monthly_minor",
      label: "الوحدة الاستثمارية",
      description: "قيمة افتراضية للتحرير فقط، غير مفعّلة بالفوترة",
    },
    {
      key: "annual_discount_percent",
      label: "خصم الاشتراك السنوي",
      description: "نسبة قابلة للتغيير في مسودة التسعير الجديدة",
      annualField: true,
    },
  ];

  const valid =
    Object.values(rates).every(numeric) &&
    rates.annual_discount_percent <= 100 &&
    tiers.length > 0 &&
    tiers.every((tier, i) => {
      const expectedMin = i === 0 ? 1 : (tiers[i - 1].max ?? -1) + 1;
      return (
        numeric(tier.min) &&
        numeric(tier.unit_monthly_minor) &&
        tier.min === expectedMin &&
        (i === tiers.length - 1
          ? tier.max === null
          : tier.max !== null &&
            numeric(tier.max) &&
            tier.max >= tier.min)
      );
    }) &&
    numeric(seats) &&
    numeric(rights) &&
    numeric(issuedShares);

  const totals = useMemo(() => {
    if (!valid) return null;

    const seatRate =
      seats === 0
        ? 0
        : tiers.find(
            (tier) =>
              seats >= tier.min &&
              (tier.max === null || seats <= tier.max)
          )?.unit_monthly_minor;

    if (seatRate === undefined) return null;

    const rightsCharge = listed
      ? Math.round(
          (issuedShares * rates.listed_million_shares_monthly_minor) /
            1000000
        )
      : rights * rates.rightsholder_monthly_minor;

    const monthly =
      rates.base_monthly_minor + rightsCharge + seats * seatRate;
    const gross = monthly * (annual ? 12 : 1);
    const discount = annual
      ? Math.round((gross * rates.annual_discount_percent) / 100)
      : 0;

    if (![monthly, gross, discount].every(Number.isSafeInteger)) {
      return null;
    }

    return {
      seatRate,
      monthly,
      gross,
      discount,
      payable: gross - discount,
    };
  }, [valid, rates, tiers, seats, rights, issuedShares, listed, annual]);

  const updateRate = (key: keyof Rates, value: number) => {
    setRates((previous) => ({ ...previous, [key]: value }));
  };

  const reset = () => {
    setRates({ ...defaultRates });
    setTiers(defaultTiers.map((tier) => ({ ...tier })));
    setSeats(25);
    setRights(5);
    setIssuedShares(1000000);
    setListed(false);
    setAnnual(true);
  };

  return (
    <main dir="rtl" className="mx-auto max-w-7xl space-y-7 p-5 md:p-9">
      <header className="space-y-3">
        <Link
          href="/platform/payments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight size={16} />
          إدارة مدفوعات المنصة
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              إدارة أسعار الاشتراكات
            </h1>
            <p className="mt-2 text-muted-foreground">
              تحرير الأسعار والشرائح والخصم السنوي ومعاينة النتائج
            </p>
          </div>
          <span className="rounded-full border px-4 py-2 text-sm font-medium">
            مسودة محلية — غير منشورة
          </span>
        </div>
      </header>

      <section className="rounded-2xl border bg-muted/40 p-5">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-1 shrink-0" size={20} />
          <div className="space-y-1">
            <p className="font-semibold">وضع المعاينة الآمنة</p>
            <p className="text-sm leading-7 text-muted-foreground">
              القيم أدناه للمعاينة والتحرير داخل المتصفح فقط. لا
              تُحفظ في الكتالوج، ولا تُصدر فواتير أو عروض أسعار، ولا
              تؤثر في المشتركين الحاليين. الخصم السنوي القابل للتعديل
              ينتظر عقد كتالوج جديدًا قبل الحفظ والاعتماد.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 md:p-7">
            <h2 className="mb-5 text-xl font-semibold">
              أسعار المنصة
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              {fields.map((field) => (
                <label key={field.key} className="space-y-2">
                  <span className="block font-medium">{field.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {field.description}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={field.annualField ? 100 : undefined}
                      step={field.annualField ? 1 : 0.01}
                      value={
                        field.annualField
                          ? rates[field.key]
                          : rates[field.key] / 100
                      }
                      onChange={(event) => {
                        const number = Number(event.target.value);
                        updateRate(
                          field.key,
                          field.annualField
                            ? number
                            : Math.round(number * 100)
                        );
                      }}
                      className="min-w-0 w-full rounded-lg border bg-background px-3 py-2.5 text-left"
                      dir="ltr"
                    />
                    <span className="text-sm text-muted-foreground">
                      {field.annualField ? "%" : "USD"}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 md:p-7">
            <h2 className="text-xl font-semibold">
              شرائح المستخدمين التشغيليين
            </h2>
            <p className="mb-5 mt-2 text-sm text-muted-foreground">
              يعتمد سعر الوحدة على الشريحة التي يقع فيها إجمالي
              عدد المستخدمين، وفق نموذج التسعير الحالي.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 text-xs font-medium text-muted-foreground">
                <span>من مستخدم</span>
                <span>إلى مستخدم</span>
                <span>سعر المستخدم / USD</span>
              </div>

              {tiers.map((tier, index) => (
                <div
                  key={tier.min}
                  className="grid grid-cols-[1fr_1fr_1fr] items-center gap-3"
                >
                  <span className="rounded-lg bg-muted px-3 py-2.5">
                    {tier.min.toLocaleString("en-US")}
                  </span>
                  <span className="rounded-lg bg-muted px-3 py-2.5">
                    {tier.max?.toLocaleString("en-US") ?? "فأكثر"}
                  </span>
                  <input
                    aria-label={`سعر الشريحة ${index + 1}`}
                    type="number"
                    min="0"
                    step="0.01"
                    dir="ltr"
                    value={tier.unit_monthly_minor / 100}
                    onChange={(event) => {
                      const next = tiers.map((item) => ({ ...item }));
                      next[index].unit_monthly_minor = Math.round(
                        Number(event.target.value) * 100
                      );
                      setTiers(next);
                    }}
                    className="min-w-0 w-full rounded-lg border bg-background px-3 py-2.5 text-left"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Calculator size={20} />
              <h2 className="text-xl font-semibold">معاينة الاشتراك</h2>
            </div>

            <label className="mb-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={listed}
                onChange={(event) => setListed(event.target.checked)}
              />
              شركة مساهمة مدرجة
            </label>

            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm">المستخدمون التشغيليون</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={seats}
                  onChange={(event) => setSeats(Number(event.target.value))}
                  className="w-full rounded-lg border bg-background px-3 py-2"
                  dir="ltr"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm">
                  {listed ? "الأسهم المصدرة" : "أصحاب الحقوق"}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={listed ? issuedShares : rights}
                  onChange={(event) =>
                    listed
                      ? setIssuedShares(Number(event.target.value))
                      : setRights(Number(event.target.value))
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2"
                  dir="ltr"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm">دورة الاشتراك</span>
                <select
                  value={annual ? "annual" : "monthly"}
                  onChange={(event) =>
                    setAnnual(event.target.value === "annual")
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2"
                >
                  <option value="monthly">شهري</option>
                  <option value="annual">سنوي</option>
                </select>
              </label>
            </div>

            <div className="mt-6 space-y-3 border-t pt-5">
              {!totals ? (
                <p className="text-sm text-destructive">
                  يرجى إدخال قيم صحيحة وغير سالبة.
                </p>
              ) : (
                <>
                  <div className="flex justify-between gap-3 text-sm">
                    <span>المقابل الشهري قبل الخصم</span>
                    <strong dir="ltr">{money(totals.monthly)}</strong>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span>قيمة الفترة</span>
                    <strong dir="ltr">{money(totals.gross)}</strong>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span>الخصم</span>
                    <strong dir="ltr">-{money(totals.discount)}</strong>
                  </div>
                  <div className="flex justify-between gap-3 border-t pt-4">
                    <span className="font-semibold">
                      إجمالي المعاينة قبل الضريبة
                    </span>
                    <strong className="text-xl" dir="ltr">
                      {money(totals.payable)}
                    </strong>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck size={20} />
              حالة الحوكمة
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              حفظ المسودة، إرسالها للمراجعة، اعتمادها، ونشرها
              غير متاحة من هذه النسخة حتى يكتمل ربط API
              وعقد الخصم السنوي القابل للإصدار.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 font-medium hover:bg-muted"
            >
              <RotateCcw size={16} />
              إعادة القيم الافتراضية
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}

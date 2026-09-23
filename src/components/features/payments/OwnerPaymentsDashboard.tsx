type SummaryCardProps = {
  title: string;
  description: string;
};

function SummaryCard({ title, description }: SummaryCardProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <p className="text-sm text-neutral-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold">—</p>
      <p className="mt-2 text-xs text-neutral-500">{description}</p>
    </section>
  );
}

import type { TenantTransactionsResult } from "@/lib/payments-api";

/**
 * Amounts arrive as integer minor-unit strings.
 * SAR has two decimal places; do not assume that for other currencies.
 * BigInt avoids precision loss for large amounts.
 */
export function formatPaymentAmount(
  amountMinor: string,
  currency: string,
): string {
  if (currency !== "SAR" || !/^\d{1,20}$/.test(amountMinor)) {
    return `${amountMinor} ${currency} (وحدات صغرى)`;
  }

  const value = BigInt(amountMinor);
  const whole = value / BigInt(100);
  const fraction = (value % BigInt(100)).toString().padStart(2, "0");

  return `${new Intl.NumberFormat("en-US").format(whole)}.${fraction} SAR`;
}

type OwnerPaymentsDashboardProps = {
  transactions: TenantTransactionsResult;
};

export default function OwnerPaymentsDashboard({
  transactions,
}: OwnerPaymentsDashboardProps) {
  return (
    <div dir="rtl" className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl bg-neutral-950 p-7 text-white">
        <p className="text-sm text-amber-300">CEO App · المدفوعات</p>
        <h1 className="mt-2 text-3xl font-bold">مدفوعات منشآتي</h1>
        <p className="mt-3 max-w-2xl text-sm text-neutral-300">
          إدارة مدفوعات المنشآت المملوكة لحسابك، ومتابعة العمليات
          والتسويات والاشتراكات من مكان واحد.
        </p>
        <p className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          واجهة قيد التجهيز — لا توجد بيانات مالية متصلة حاليًا.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="إجمالي العمليات" description="بانتظار الربط الآمن" />
        <SummaryCard title="المدفوعات الناجحة" description="بانتظار الربط الآمن" />
        <SummaryCard title="المستحقات" description="بانتظار الربط الآمن" />
        <SummaryCard title="التسويات" description="بانتظار الربط الآمن" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-lg font-bold">عمليات منشآتي</h2>
          <p className="mt-2 text-sm text-neutral-500">
              آخر 20 عملية للمنشأة المختارة فقط، بعد التحقق من الصلاحية
              في خدمة المدفوعات.
            </p>
          {transactions.state === "unavailable" ? (
              <div
                role="status"
                className="mt-6 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700"
              >
                سجل العمليات غير متاح حاليًا. لم يتم تفعيل الاتصال بالبيانات المالية.
              </div>
            ) : transactions.transactions.length === 0 ? (
              <div
                role="status"
                className="mt-6 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700"
              >
                لا توجد عمليات مسجلة لهذه المنشأة.
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-neutral-200 dark:divide-neutral-800">
                {transactions.transactions.map((transaction) => (
                  <li
                    key={transaction.public_id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium" dir="ltr">
                        {transaction.public_id}
                      </p>
                      <p className="mt-1 text-neutral-500">
                        الحالة: {transaction.status}
                      </p>
                      <p className="mt-1 text-neutral-500">
                        تاريخ التسجيل: {transaction.created_at}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold" dir="ltr">
                        {formatPaymentAmount(
                          transaction.amount_minor,
                          transaction.currency,
                        )}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {transaction.currency === "SAR"
                          ? "المبلغ بالريال السعودي"
                          : "المبلغ بوحدات العملة الصغرى"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-lg font-bold">الاشتراكات والتسويات</h2>
          <p className="mt-2 text-sm text-neutral-500">
            متابعة الفواتير وحالة الاشتراك والمستحقات والتسويات
            الخاصة بمنشآتك فقط.
          </p>
          <div className="mt-6 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
            سيتم التفعيل بعد اعتماد الربط
          </div>
        </section>
      </div>
    </div>
  );
}

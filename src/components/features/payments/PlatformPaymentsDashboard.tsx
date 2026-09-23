type PlatformCardProps = {
  title: string;
  description: string;
};

function PlatformCard({ title, description }: PlatformCardProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <p className="text-sm text-neutral-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold">—</p>
      <p className="mt-2 text-xs text-neutral-500">{description}</p>
    </section>
  );
}

export default function PlatformPaymentsDashboard() {
  return (
    <div dir="rtl" className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl bg-neutral-950 p-7 text-white">
        <p className="text-sm text-amber-300">CEO App · إدارة المنصة</p>
        <h1 className="mt-2 text-3xl font-bold">مركز إدارة المدفوعات</h1>
        <p className="mt-3 max-w-2xl text-sm text-neutral-300">
          واجهة السوبر أدمن لإدارة العمليات وحسابات التجار والعمولات
          والتسويات والاستثناءات على مستوى المنصة.
        </p>
        <p className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          واجهة قيد التجهيز — العمليات المالية الحقيقية غير مفعلة.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PlatformCard title="حجم المدفوعات" description="بانتظار الربط الآمن" />
        <PlatformCard title="عمولات المنصة" description="بانتظار الربط الآمن" />
        <PlatformCard title="التسويات المعلقة" description="بانتظار الربط الآمن" />
        <PlatformCard title="العمليات الاستثنائية" description="بانتظار الربط الآمن" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-lg font-bold">حسابات التجار والمشتركين</h2>
          <p className="mt-2 text-sm text-neutral-500">
            ستظهر حالة تفعيل التجار والتحقق والارتباط بمزود المدفوعات
            بعد اكتمال صلاحيات السوبر أدمن في الخادم.
          </p>
          <div className="mt-6 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
            لا توجد بيانات متصلة
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-lg font-bold">المراقبة والتسويات</h2>
          <p className="mt-2 text-sm text-neutral-500">
            مراقبة حالات المعاملات والتسويات والاستردادات وسجل
            التدقيق من نطاق إداري منفصل عن حسابات المشتركين.
          </p>
          <div className="mt-6 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
            سيتم التفعيل بعد اعتماد الربط
          </div>
        </section>
      </div>
    </div>
  );
}

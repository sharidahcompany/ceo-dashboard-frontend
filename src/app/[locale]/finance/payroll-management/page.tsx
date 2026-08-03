import { redirect } from "next/navigation";

export default async function CoreOperationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/finance/payroll-management/payroll`);
}

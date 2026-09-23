import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/actions/workspace/user.actions";
import PlatformPaymentsDashboard from "@/components/features/payments/PlatformPaymentsDashboard";

export default async function PlatformPaymentsPage() {
  // Resolve identity on the server; never use persisted browser roles.
  const result = await getAuthenticatedUser();

  if (!result.success || !result.data) {
    notFound();
  }

  // Platform scope requires the global role. Tenant ownership is not enough.
  const isPlatformSuperAdmin =
    Array.isArray(result.data.roles) &&
    result.data.roles.includes("super-admin");

  if (!isPlatformSuperAdmin) {
    notFound();
  }

  // Presentation only: no financial records or payment operations are loaded.
  return <PlatformPaymentsDashboard />;
}

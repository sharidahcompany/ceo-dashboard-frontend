import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/actions/workspace/user.actions";
import OwnerPaymentsDashboard from "@/components/features/payments/OwnerPaymentsDashboard";
import { getTenantTransactions } from "@/lib/payments-api";

type TenantMembership = {
  id?: string | number;
  pivot?: {
    role?: string | null;
    status?: string | null;
  } | null;
};

export default async function OwnerPaymentsPage() {
  // This route never trusts the browser's Zustand role or tenant state.
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant")?.value;

  if (!tenantId) {
    notFound();
  }

  // /auth/me must authenticate the request on the backend.
  const result = await getAuthenticatedUser();

  if (!result.success || !result.data) {
    notFound();
  }

  const memberships: TenantMembership[] = Array.isArray(result.data.tenants)
    ? result.data.tenants
    : [];

  // Explicitly match the requested tenant AND its owner role.
  // Never use tenant_role: the current auth resource has a first-tenant
  // fallback that is unsuitable for payment authorization.
  const isOwnerOfSelectedTenant = memberships.some(
    (membership) =>
      String(membership.id ?? "") === tenantId &&
      membership.pivot?.role === "owner" &&
      membership.pivot?.status === "accepted",
  );

  if (!isOwnerOfSelectedTenant) {
    notFound();
  }

  // The payments service independently verifies the JWT and exact tenant.
  const transactions = await getTenantTransactions(tenantId);
  return <OwnerPaymentsDashboard transactions={transactions} />;
}

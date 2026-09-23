import "server-only";

import { cookies } from "next/headers";

export type PaymentTransaction = {
  public_id: string;
  currency: string;
  amount_minor: string;
  status: string;
  confirmed_at: string | null;
  created_at: string;
};

export type TenantTransactionsResult =
  | { state: "ready"; transactions: PaymentTransaction[] }
  | { state: "unavailable"; transactions: [] };

const unavailable = (): TenantTransactionsResult => ({
  state: "unavailable",
  transactions: [],
});

function verifiedPaymentsOrigin(): string | null {
  const configured = process.env.PAYMENTS_SERVICE_URL;

  if (!configured || configured.trim() !== configured) {
    return null;
  }

  try {
    const url = new URL(configured);

    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function isTransaction(value: unknown): value is PaymentTransaction {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.public_id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      item.public_id,
    ) &&
    typeof item.currency === "string" &&
    /^[A-Z]{3}$/.test(item.currency) &&
    typeof item.amount_minor === "string" &&
    /^\d{1,20}$/.test(item.amount_minor) &&
    typeof item.status === "string" &&
    item.status.length > 0 &&
    item.status.length <= 32 &&
    (item.confirmed_at === null ||
      typeof item.confirmed_at === "string") &&
    typeof item.created_at === "string"
  );
}

/**
 * Server-only, read-only request.
 *
 * The payments service independently verifies the JWT and accepted owner
 * membership for the exact tenant. This frontend helper is not an
 * authorization boundary.
 *
 * No browser-side token exposure, client-supplied roles or financial writes.
 */
export async function getTenantTransactions(
  tenantId: string,
): Promise<TenantTransactionsResult> {
  const origin = verifiedPaymentsOrigin();

  if (
    !origin ||
    !tenantId ||
    tenantId.trim() !== tenantId ||
    tenantId.length > 191 ||
    /[\s/?#\\\x00-\x1f\x7f]/.test(tenantId)
  ) {
    return unavailable();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (
    !token ||
    token.trim() !== token ||
    /[\s\x00-\x1f\x7f]/.test(token)
  ) {
    return unavailable();
  }

  const url =
    `${origin}/api/payments/tenants/` +
    `${encodeURIComponent(tenantId)}/transactions`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return unavailable();
    }

    const payload: unknown = await response.json();

    if (typeof payload !== "object" || payload === null) {
      return unavailable();
    }

    const data = (payload as Record<string, unknown>).data;

    if (
      !Array.isArray(data) ||
      data.length > 20 ||
      !data.every(isTransaction)
    ) {
      return unavailable();
    }

    // Explicitly copy permitted fields. Never forward extra API fields.
    const transactions: PaymentTransaction[] = data.map(
      (item: PaymentTransaction) => ({
        public_id: item.public_id,
        currency: item.currency,
        amount_minor: item.amount_minor,
        status: item.status,
        confirmed_at: item.confirmed_at,
        created_at: item.created_at,
      }),
    );

    return { state: "ready", transactions };
  } catch {
    return unavailable();
  }
}

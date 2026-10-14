"use server";

import { cookies } from "next/headers";
import { getAuthenticatedUser } from "@/actions/workspace/user.actions";

export type PricingSeatTier = {
  min: number;
  max: number | null;
  unit_monthly_minor: number;
};

export type PricingV2DraftInput = {
  version: string;
  effective_from: string;
  effective_until: string;
  currency: "USD";
  base_monthly_minor: number;
  rightsholder_monthly_minor: number;
  listed_million_shares_monthly_minor: number;
  investment_unit_monthly_minor: number;
  operational_seat_tiers: PricingSeatTier[];
  annual_discount_basis_points: number;
};

export type SavePricingDraftResult =
  | {
      success: true;
      publicId: string;
      version: string;
      digest: string;
      status: "draft";
    }
  | {
      success: false;
      error:
        | "unavailable"
        | "unauthenticated"
        | "forbidden"
        | "invalid"
        | "conflict"
        | "upstream";
    };

const fail = (
  error: Extract<SavePricingDraftResult, { success: false }>["error"],
): SavePricingDraftResult => ({ success: false, error });

const nonnegativeInteger = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0;

function validInput(value: unknown): value is PricingV2DraftInput {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const v = value as Record<string, unknown>;
  const keys = [
    "version",
    "effective_from",
    "effective_until",
    "currency",
    "base_monthly_minor",
    "rightsholder_monthly_minor",
    "listed_million_shares_monthly_minor",
    "investment_unit_monthly_minor",
    "operational_seat_tiers",
    "annual_discount_basis_points",
  ];

  if (
    Object.keys(v).length !== keys.length ||
    !keys.every((key) => Object.hasOwn(v, key))
  ) {
    return false;
  }

  if (
    typeof v.version !== "string" ||
    !/^[A-Za-z0-9_-]{1,64}$/.test(v.version) ||
    v.currency !== "USD"
  ) {
    return false;
  }

  const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

  if (
    typeof v.effective_from !== "string" ||
    typeof v.effective_until !== "string" ||
    !timestamp.test(v.effective_from) ||
    !timestamp.test(v.effective_until) ||
    !Number.isFinite(Date.parse(v.effective_from)) ||
    !Number.isFinite(Date.parse(v.effective_until)) ||
    Date.parse(v.effective_from) >= Date.parse(v.effective_until)
  ) {
    return false;
  }

  for (const key of [
    "base_monthly_minor",
    "rightsholder_monthly_minor",
    "listed_million_shares_monthly_minor",
    "investment_unit_monthly_minor",
  ]) {
    if (!nonnegativeInteger(v[key])) {
      return false;
    }
  }

  if (
    !nonnegativeInteger(v.annual_discount_basis_points) ||
    v.annual_discount_basis_points > 10000 ||
    !Array.isArray(v.operational_seat_tiers) ||
    v.operational_seat_tiers.length === 0 ||
    v.operational_seat_tiers.length > 100
  ) {
    return false;
  }

  let nextMin = 1;

  for (const [index, item] of v.operational_seat_tiers.entries()) {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item)
    ) {
      return false;
    }

    const tier = item as Record<string, unknown>;

    if (
      Object.keys(tier).length !== 3 ||
      !["min", "max", "unit_monthly_minor"].every(
        (key) => Object.hasOwn(tier, key),
      ) ||
      !nonnegativeInteger(tier.min) ||
      tier.min !== nextMin ||
      !nonnegativeInteger(tier.unit_monthly_minor)
    ) {
      return false;
    }

    if (index === v.operational_seat_tiers.length - 1) {
      if (tier.max !== null) return false;
    } else {
      if (!nonnegativeInteger(tier.max) || tier.max < tier.min) {
        return false;
      }

      nextMin = tier.max + 1;

      if (!Number.isSafeInteger(nextMin)) return false;
    }
  }

  return true;
}

function paymentsOrigin(): string | null {
  const configured = process.env.PAYMENTS_SERVICE_URL;

  if (!configured || configured.trim() !== configured) return null;

  try {
    const url = new URL(configured);

    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Saves an unapproved catalog draft only.
 * This action never approves, publishes or activates billing.
 */
export async function savePlatformPricingDraft(
  input: PricingV2DraftInput,
): Promise<SavePricingDraftResult> {
  // Independent frontend feature gate; Payments has its own gate.
  if (process.env.PLATFORM_PRICING_DRAFT_SAVE_ENABLED !== "true") {
    return fail("unavailable");
  }

  const origin = paymentsOrigin();

  if (!origin) return fail("unavailable");

  const identity = await getAuthenticatedUser();

  if (!identity.success || !identity.data) {
    return fail("unauthenticated");
  }

  if (
    !Array.isArray(identity.data.roles) ||
    !identity.data.roles.includes("super-admin")
  ) {
    return fail("forbidden");
  }

  // Client-provided roles, statuses and approvals are never accepted.
  if (!validInput(input)) return fail("invalid");

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (
    !token ||
    token.trim() !== token ||
    /[\s\x00-\x1f\x7f]/.test(token)
  ) {
    return fail("unauthenticated");
  }

  // Reconstruct in the explicit order of the V2 contract.
  const payload: PricingV2DraftInput = {
    version: input.version,
    effective_from: input.effective_from,
    effective_until: input.effective_until,
    currency: "USD",
    base_monthly_minor: input.base_monthly_minor,
    rightsholder_monthly_minor: input.rightsholder_monthly_minor,
    listed_million_shares_monthly_minor:
      input.listed_million_shares_monthly_minor,
    investment_unit_monthly_minor: input.investment_unit_monthly_minor,
    operational_seat_tiers: input.operational_seat_tiers.map((tier) => ({
      min: tier.min,
      max: tier.max,
      unit_monthly_minor: tier.unit_monthly_minor,
    })),
    annual_discount_basis_points: input.annual_discount_basis_points,
  };

  try {
    const response = await fetch(
      `${origin}/api/payments/platform/pricing/drafts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(5000),
      },
    );

    if (response.status === 401) return fail("unauthenticated");
    if (response.status === 403) return fail("forbidden");
    if (response.status === 409) return fail("conflict");
    if (response.status === 422) return fail("invalid");
    if (!response.ok || response.status !== 201) {
      return fail("upstream");
    }

    const result: unknown = await response.json();

    if (
      typeof result !== "object" ||
      result === null ||
      !Object.hasOwn(result, "data")
    ) {
      return fail("upstream");
    }

    const data = (result as Record<string, unknown>).data;

    if (typeof data !== "object" || data === null) {
      return fail("upstream");
    }

    const item = data as Record<string, unknown>;

    if (
      typeof item.public_id !== "string" ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(
        item.public_id,
      ) ||
      item.version !== input.version ||
      item.status !== "draft" ||
      typeof item.snapshot_digest !== "string" ||
      !/^[a-f0-9]{64}$/i.test(item.snapshot_digest)
    ) {
      return fail("upstream");
    }

    return {
      success: true,
      publicId: item.public_id,
      version: item.version as string,
      digest: item.snapshot_digest,
      status: "draft",
    };
  } catch {
    return fail("upstream");
  }
}

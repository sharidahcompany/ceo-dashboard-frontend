"use server";

import "server-only";
import { cookies } from "next/headers";

export interface CommercialAgreement {
  beneficiary_id: string;
  beneficiary_type: string;
  compensation_type: "fixed" | "percentage" | "mixed";
  currency: string;
  fixed_minor: string;
  rate_basis_points: number;
  percentage_basis: string | null;
  earning_condition: string;
  commission_cap_minor: string | null;
}

export interface SaveCommercialPlanInput {
  campaign_id: string;
  legal_entity_id: number;
  currency: string;
  total_minor: string;
  allocations: Record<string, string>;
  agreements: CommercialAgreement[];
  expected_revision: number;
}

export type SaveCommercialPlanResult =
  | { success: true; revision: number }
  | { success: false; error: string };

const unavailable = (): SaveCommercialPlanResult => ({
  success: false,
  error: "خدمة حفظ الخطة التجارية غير متاحة في البيئة الحالية.",
});

function validMinor(value: unknown): value is string {
  return typeof value === "string" &&
    /^(0|[1-9][0-9]{0,17})$/.test(value);
}

function validInput(value: SaveCommercialPlanInput): boolean {
  if (!value || typeof value !== "object") return false;

  if (
    typeof value.campaign_id !== "string" ||
    !/^[A-Za-z0-9_-]{1,64}$/.test(value.campaign_id) ||
    !Number.isSafeInteger(value.legal_entity_id) ||
    value.legal_entity_id < 1 ||
    typeof value.currency !== "string" ||
    !/^[A-Z]{3}$/.test(value.currency) ||
    !validMinor(value.total_minor) ||
    !Number.isSafeInteger(value.expected_revision) ||
    value.expected_revision < 0 ||
    !value.allocations ||
    typeof value.allocations !== "object" ||
    Array.isArray(value.allocations) ||
    !Array.isArray(value.agreements)
  ) return false;

  const allocations = Object.entries(value.allocations);

  if (
    allocations.length > 100 ||
    value.agreements.length > 100 ||
    !allocations.every(([channel, amount]) =>
      /^[A-Za-z0-9_-]{1,64}$/.test(channel) && validMinor(amount) && BigInt(amount) > BigInt(0)
    )
  ) return false;

  // Integer-only monetary calculations.
  // BigInt(0) avoids the ES2020 literal error caused by 0n.
  const allocated = allocations.reduce(
    (sum, [, amount]) => sum + BigInt(amount),
    BigInt(0),
  );

  if (allocated !== BigInt(value.total_minor)) return false;

  const beneficiaries = new Set<string>();

  for (const agreement of value.agreements) {
    if (
      !agreement ||
      typeof agreement.beneficiary_id !== "string" ||
      !/^[A-Za-z0-9_-]{1,100}$/.test(agreement.beneficiary_id) ||
      beneficiaries.has(agreement.beneficiary_id) ||
      !["employee", "marketing_agency", "influencer",
        "external_partner"].includes(agreement.beneficiary_type) ||
      !["fixed", "percentage", "mixed"].includes(
        agreement.compensation_type
      ) ||
      agreement.currency !== value.currency ||
      !validMinor(agreement.fixed_minor) ||
      !Number.isSafeInteger(agreement.rate_basis_points) ||
      agreement.rate_basis_points < 0 ||
      agreement.rate_basis_points > 10000 ||
      (agreement.percentage_basis !== null &&
        (typeof agreement.percentage_basis !== "string" ||
          agreement.percentage_basis.length > 40)) ||
      typeof agreement.earning_condition !== "string" ||
      !agreement.earning_condition.trim() ||
      agreement.earning_condition.length > 40 ||
      (agreement.commission_cap_minor !== null &&
        !validMinor(agreement.commission_cap_minor)) ||
      (agreement.compensation_type === "fixed" &&
        (BigInt(agreement.fixed_minor) <= BigInt(0) ||
          agreement.rate_basis_points !== 0 ||
          agreement.percentage_basis !== null ||
          agreement.commission_cap_minor !== null)) ||
      (agreement.compensation_type === "percentage" &&
        (BigInt(agreement.fixed_minor) !== BigInt(0) ||
          agreement.rate_basis_points <= 0 ||
          !agreement.percentage_basis)) ||
      (agreement.compensation_type === "mixed" &&
        (BigInt(agreement.fixed_minor) <= BigInt(0) ||
          agreement.rate_basis_points <= 0 ||
          !agreement.percentage_basis))
    ) return false;

    beneficiaries.add(agreement.beneficiary_id);
  }

  return true;
}

export async function saveMarketingCommercialPlan(
  input: SaveCommercialPlanInput,
): Promise<SaveCommercialPlanResult> {
  if (!validInput(input)) {
    return {
      success: false,
      error: "بيانات الميزانية أو الاتفاقات غير صحيحة.",
    };
  }

  if (
    process.env.NODE_ENV !== "development" ||
    process.env.CEO_MARKETING_DASHBOARD_TEST_APPROVED !== "1" ||
    process.env.CEO_MARKETING_DASHBOARD_ISOLATED_RUNTIME !== "1" ||
    process.env.CEO_MARKETING_COMMERCIAL_DASHBOARD_AUTH_READY !== "1"
  ) return unavailable();

  const base = process.env.CEO_MARKETING_COMMERCIAL_BASE_URL;
  const expectedHost =
    process.env.CEO_MARKETING_COMMERCIAL_TEST_HOST;

  if (!base || !expectedHost) return unavailable();

  let endpoint: URL;

  try {
    const parsed = new URL(base);

    if (
      parsed.protocol !== "https:" ||
      parsed.username !== "" ||
      parsed.password !== "" ||
      parsed.search !== "" ||
      parsed.hash !== "" ||
      parsed.pathname !== "/" ||
      parsed.hostname !== expectedHost ||
      /[\s/@:?#]/.test(expectedHost) ||
      /(^|\.)ceo-app\.com$/i.test(parsed.hostname)
    ) return unavailable();

    endpoint = new URL(
      `/api/marketing/campaigns/${
        encodeURIComponent(input.campaign_id)
      }/commercial-plan`,
      parsed,
    );
  } catch {
    return unavailable();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const tenant = cookieStore.get("tenant")?.value;

  if (
    !token ||
    token.trim() !== token ||
    /[\s\x00-\x1f\x7f]/.test(token)
  ) {
    return { success: false, error: "يرجى تسجيل الدخول مجددًا." };
  }

  if (
    !tenant ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(tenant)
  ) {
    return { success: false, error: "يرجى اختيار منشأة صالحة." };
  }

  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Tenant": tenant,
        "X-Legal-Entity-Id": String(input.legal_entity_id),
        Origin: "https://app.ceo-app.com",
      },
      body: JSON.stringify({
        currency: input.currency,
        total_minor: input.total_minor,
        allocations: input.allocations,
        agreements: input.agreements,
        expected_revision: input.expected_revision,
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: "ليست لديك صلاحية تعديل الخطة التجارية.",
      };
    }

    if (response.status === 409) {
      return {
        success: false,
        error: "تغيرت الخطة. أعد تحميلها قبل التعديل.",
      };
    }

    if (![200, 201].includes(response.status)) {
      return {
        success: false,
        error: "تعذر حفظ الخطة التجارية.",
      };
    }

    const payload: unknown = await response.json();

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("data" in payload) ||
      typeof payload.data !== "object" ||
      payload.data === null ||
      !("revision" in payload.data) ||
      !Number.isSafeInteger(payload.data.revision) ||
      payload.data.revision !== input.expected_revision + 1
    ) return unavailable();

    return {
      success: true,
      revision: payload.data.revision as number,
    };
  } catch {
    return {
      success: false,
      error: "تعذر الاتصال بخدمة التسويق.",
    };
  }
}

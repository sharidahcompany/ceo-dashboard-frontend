"use server";

import "server-only";
import { cookies } from "next/headers";

export type CommercialPlanReadResult =
  | {
      success: true;
      data: {
        campaign_id: string;
        currency: string;
        total_minor: string;
        revision: number;
        allocations: Record<string, string>;
        agreements: Array<Record<string, unknown>>;
        updated_by?: string;
        updated_at?: string;
      };
    }
  | { success: false; error: string };

const unavailable = (): CommercialPlanReadResult => ({
  success: false,
  error: "خدمة قراءة الخطة التجارية غير متاحة في البيئة الحالية.",
});

export async function readMarketingCommercialPlan(
  campaignId: string,
  legalEntityId: number,
): Promise<CommercialPlanReadResult> {
  if (
    typeof campaignId !== "string" ||
    !/^[A-Za-z0-9_-]{1,64}$/.test(campaignId) ||
    !Number.isSafeInteger(legalEntityId) ||
    legalEntityId < 1
  ) {
    return {
      success: false,
      error: "بيانات الحملة أو الكيان القانوني غير صحيحة.",
    };
  }

  // Reuse the existing Dashboard isolated-runtime policy.
  // These flags must never be set in production.
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.CEO_MARKETING_DASHBOARD_TEST_APPROVED !== "1" ||
    process.env.CEO_MARKETING_DASHBOARD_ISOLATED_RUNTIME !== "1" ||
    process.env.CEO_MARKETING_COMMERCIAL_DASHBOARD_AUTH_READY !== "1"
  ) {
    return unavailable();
  }

  const base = process.env.CEO_MARKETING_COMMERCIAL_BASE_URL;
  const expectedHost =
    process.env.CEO_MARKETING_COMMERCIAL_TEST_HOST;

  if (!base || !expectedHost) return unavailable();

  let endpoint: URL;

  try {
    const parsedBase = new URL(base);

    if (
      parsedBase.protocol !== "https:" ||
      parsedBase.username !== "" ||
      parsedBase.password !== "" ||
      parsedBase.search !== "" ||
      parsedBase.hash !== "" ||
      parsedBase.pathname !== "/" ||
      parsedBase.hostname !== expectedHost ||
      /[\s/@:?#]/.test(expectedHost) ||
      /(^|\.)ceo-app\.com$/i.test(parsedBase.hostname)
    ) {
      return unavailable();
    }

    endpoint = new URL(
      `/api/marketing/campaigns/${encodeURIComponent(campaignId)}/commercial-plan`,
      parsedBase,
    );
  } catch {
    return unavailable();
  }

  const cookieStore = await cookies();

  // Match create-campaign.actions.ts exactly.
  // Cookies are user-selected context, not proof of authorization.
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
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-Tenant": tenant,
        "X-Legal-Entity-Id": String(legalEntityId),
        Origin: "https://app.ceo-app.com",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: "ليست لديك صلاحية الاطلاع على هذه الخطة التجارية.",
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        error: "الخطة التجارية غير موجودة أو غير متاحة.",
      };
    }

    if (response.status !== 200) return unavailable();

    const payload: unknown = await response.json();

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("data" in payload) ||
      typeof payload.data !== "object" ||
      payload.data === null
    ) {
      return unavailable();
    }

    const data = payload.data as Record<string, unknown>;

    if (
      data.campaign_id !== campaignId ||
      typeof data.currency !== "string" ||
      !/^[A-Z]{3}$/.test(data.currency) ||
      typeof data.total_minor !== "string" ||
      !/^\d+$/.test(data.total_minor) ||
      typeof data.revision !== "number" ||
      !Number.isSafeInteger(data.revision) ||
      data.revision < 1 ||
      typeof data.allocations !== "object" ||
      data.allocations === null ||
      Array.isArray(data.allocations) ||
      !Object.values(data.allocations).every(
        (v) => typeof v === "string" && /^\d+$/.test(v)
      ) ||
      !Array.isArray(data.agreements) ||
      !data.agreements.every(
        (v) => typeof v === "object" && v !== null &&
          !Array.isArray(v)
      )
    ) {
      return unavailable();
    }

    return {
      success: true,
      data: {
        campaign_id: data.campaign_id,
        currency: data.currency,
        total_minor: data.total_minor,
        revision: data.revision,
        allocations: data.allocations as Record<string, string>,
        agreements: data.agreements as Array<Record<string, unknown>>,
        ...(typeof data.updated_by === "string"
          ? { updated_by: data.updated_by } : {}),
        ...(typeof data.updated_at === "string"
          ? { updated_at: data.updated_at } : {}),
      },
    };
  } catch {
    return {
      success: false,
      error: "تعذر الاتصال بخدمة التسويق.",
    };
  }
}

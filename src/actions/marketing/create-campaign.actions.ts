"use server";

import "server-only";
import { cookies } from "next/headers";

// A57-G04.12-F8-R1
// Fail-closed server action. No network or database writes.

export interface CreateMarketingCampaignInput {
  legal_entity_id: number;
  catalog_id: number;
  selection_mode: "specific" | "all";
  item_ids?: number[];
  campaign_code: string;
  name: string;
  objective: string;
}

export type CreateMarketingCampaignResult =
  | { success: true; campaignId: string }
  | { success: false; error: string };

export async function createMarketingCampaign(
  input: CreateMarketingCampaignInput,
): Promise<CreateMarketingCampaignResult> {
  if (
    !Number.isSafeInteger(input.legal_entity_id) ||
    input.legal_entity_id < 1 ||
    !Number.isSafeInteger(input.catalog_id) ||
    input.catalog_id < 1
  ) {
    return { success: false, error: "نطاق الكتالوج غير صالح." };
  }

  if (input.selection_mode !== "specific" &&
      input.selection_mode !== "all") {
    return { success: false, error: "طريقة اختيار غير صالحة." };
  }

  if (input.selection_mode === "specific" &&
      (!Array.isArray(input.item_ids) ||
       input.item_ids.length === 0 ||
       !input.item_ids.every(
         (id) => Number.isSafeInteger(id) && id > 0
       ))) {
    return { success: false, error: "حدد منتجات صحيحة." };
  }

  if (input.selection_mode === "all" &&
      input.item_ids !== undefined) {
    return { success: false, error: "قائمة المنتجات غير مسموحة." };
  }

  if (
    typeof input.campaign_code !== "string" ||
    typeof input.name !== "string" ||
    typeof input.objective !== "string" ||
    !input.campaign_code.trim() ||
    !input.name.trim() ||
    !input.objective.trim()
  ) {
    return { success: false, error: "بيانات الحملة غير مكتملة." };
  }

  // The production route is intentionally disabled.
  // This path is only for explicitly approved isolated local testing.
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.CEO_MARKETING_DASHBOARD_TEST_APPROVED !== "1" ||
    process.env.CEO_MARKETING_DASHBOARD_ISOLATED_RUNTIME !== "1"
  ) {
    return {
      success: false,
      error: "إنشاء الحملات غير مفعل حتى اعتماد الربط الآمن.",
    };
  }

  const origin = "http://marketing-gateway:8080";

  if (
    input.campaign_code.length > 128 ||
    input.name.length > 255 ||
    input.objective.length > 2000 ||
    (input.item_ids?.length ?? 0) > 1000
  ) {
    return { success: false, error: "بيانات الحملة تتجاوز الحدود المسموحة." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const selectedTenant = cookieStore.get("tenant")?.value;

  if (
    !token ||
    token.trim() !== token ||
    /[\s\x00-\x1f\x7f]/.test(token)
  ) {
    return { success: false, error: "يرجى تسجيل الدخول مجددًا." };
  }


  // Untrusted tenant selection from the server-side session.
  // Marketing/Auth V2 must independently authorize JWT + tenant.
  if (
    !selectedTenant ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(selectedTenant)
  ) {
    return {
      success: false,
      error: "يرجى اختيار منشأة صالحة.",
    };
  }

  try {
    const response = await fetch(
      `${origin}/api/marketing/campaigns`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant": selectedTenant,
          Origin: "https://app.ceo-app.com",
        },
        body: JSON.stringify({
          legal_entity_id: input.legal_entity_id,
          catalog_id: input.catalog_id,
          selection_mode: input.selection_mode,
          ...(input.selection_mode === "specific"
            ? { item_ids: input.item_ids }
            : {}),
          campaign_code: input.campaign_code.trim(),
          name: input.name.trim(),
          objective: input.objective.trim(),
        }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (response.status === 401 || response.status === 403) {
      return { success: false, error: "ليست لديك صلاحية إنشاء هذه الحملة." };
    }

    if (response.status !== 201) {
      return { success: false, error: "تعذر اعتماد إنشاء الحملة." };
    }

    const body: unknown = await response.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("data" in body) ||
      typeof body.data !== "object" ||
      body.data === null ||
      !("id" in body.data) ||
      typeof body.data.id !== "string" ||
      !body.data.id
    ) {
      return { success: false, error: "استجابة إنشاء الحملة غير صالحة." };
    }

    return { success: true, campaignId: body.data.id };
  } catch {
    return { success: false, error: "تعذر الاتصال بخدمة التسويق." };
  }
}

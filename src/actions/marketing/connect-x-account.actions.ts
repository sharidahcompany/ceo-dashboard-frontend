"use server";

import "server-only";
import { cookies } from "next/headers";

type ConnectInput = {
  legal_entity_id: number;
  account_id: string;
};

type ConnectResult =
  | { success: true; authorization_url: string; expires_in: number }
  | { success: false; error: string };

const NONCE_COOKIE = "__Host-ceo_m360_x_nonce";

export async function connectXAccount(
  input: ConnectInput,
): Promise<ConnectResult> {
  const unavailable: ConnectResult = {
    success: false,
    error: "ربط حساب X غير متاح حاليًا.",
  };

  if (
    !input ||
    !Number.isSafeInteger(input.legal_entity_id) ||
    input.legal_entity_id < 1 ||
    typeof input.account_id !== "string" ||
    input.account_id.length < 1 ||
    input.account_id.length > 100 ||
    /[\\x00-\\x1f\\x7f]/.test(input.account_id)
  ) {
    return unavailable;
  }

  // Local development only. Never infer an origin from request headers.
  const origin = process.env.CEO_MARKETING_X_INTERNAL_ORIGIN;
  if (origin !== "http://ceo-marketing-dev-nginx:8080") {
    return unavailable;
  }

  const cookieStore = await cookies();
  const jwt = cookieStore.get("auth_token")?.value;
  const tenant = cookieStore.get("tenant")?.value;

  if (
    !jwt ||
    /\\s/.test(jwt) ||
    !tenant ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(tenant)
  ) {
    return unavailable;
  }

  try {
    const response = await fetch(
      `${origin}/api/marketing/oauth/x/connect`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          "X-Tenant": tenant,
        },
        body: JSON.stringify(input),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (response.status !== 200) {
      return unavailable;
    }

    const payload: unknown = await response.json();

    if (!payload || typeof payload !== "object") {
      return unavailable;
    }

    const data = payload as Record<string, unknown>;

    if (
      typeof data.authorization_url !== "string" ||
      data.expires_in !== 300
    ) {
      return unavailable;
    }

    const destination = new URL(data.authorization_url);

    if (
      destination.protocol !== "https:" ||
      destination.hostname !== "x.com" ||
      destination.pathname !== "/i/oauth2/authorize" ||
      destination.username ||
      destination.password ||
      destination.hash
    ) {
      return unavailable;
    }

    // Transfer only the validated short-lived browser binding.
    // Never expose the nonce in the server-action return value.
    const setCookie = response.headers.get("set-cookie") ?? "";

    const match = setCookie.match(
      /(?:^|[,\\s])__Host-ceo_m360_x_nonce=([A-Za-z0-9_-]{43})(?=;)/,
    );

    if (!match) {
      return unavailable;
    }

    cookieStore.set(NONCE_COOKIE, match[1], {
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 300,
    });

    return {
      success: true,
      authorization_url: destination.toString(),
      expires_in: 300,
    };
  } catch {
    return unavailable;
  }
}

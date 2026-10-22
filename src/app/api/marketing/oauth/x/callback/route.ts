import "server-only";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NONCE_COOKIE = "__Host-ceo_m360_x_nonce";
const NONCE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const TENANT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/;

function reject(status: number, error: string): NextResponse {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const query = request.nextUrl.searchParams;
  const keys = Array.from(query.keys());

  const state = query.get("state");
  const code = query.get("code");
  const providerError = query.get("error");

  const validState =
    typeof state === "string" && NONCE_PATTERN.test(state);

  const validSuccess =
    keys.length === 2 &&
    keys.includes("state") &&
    keys.includes("code") &&
    typeof code === "string" &&
    code.length > 0 &&
    code.length <= 4096 &&
    providerError === null;

  const validDenial =
    keys.length === 2 &&
    keys.includes("state") &&
    keys.includes("error") &&
    providerError !== null &&
    ["access_denied", "server_error", "temporarily_unavailable"]
      .includes(providerError) &&
    code === null;

  if (!validState || (!validSuccess && !validDenial)) {
    return reject(400, "invalid_x_callback");
  }

  const nonce = request.cookies.get(NONCE_COOKIE)?.value;
  if (!nonce || !NONCE_PATTERN.test(nonce)) {
    return reject(400, "invalid_x_browser_binding");
  }

  const jwt = request.cookies.get("auth_token")?.value;
  const tenant = request.cookies.get("tenant")?.value;

  if (
    !jwt ||
    /[\s\x00-\x1f\x7f]/.test(jwt) ||
    !tenant ||
    !TENANT_PATTERN.test(tenant)
  ) {
    return reject(401, "authenticated_session_required");
  }

  // The cookies are not sufficient proof of authorization.
  // Before forwarding any callback, obtain the legal entity from
  // trusted server-side context, reauthorize through Auth V2,
  // and verify the stored OAuth owner/browser binding.
  //
  // Never take JWT, tenant or legal entity from the OAuth query.
  // Never exchange an X code or consume Redis in this route
  // until the trusted callback completion path is connected.
  // Provider denial is handled separately; never attempt token exchange.
  if (validDenial) {
    return reject(400, "x_authorization_denied");
  }

  if (
    !validSuccess ||
    !code ||
    /[\\x00-\\x1f\\x7f]/.test(code)
  ) {
    return reject(400, "invalid_x_callback");
  }

  // This gate remains closed until the dedicated internal-only
  // Marketing completion endpoint is network-certified.
  if (
    process.env.CEO_MARKETING_X_CALLBACK_FORWARD_APPROVED !== "1"
  ) {
    return reject(503, "x_callback_forwarding_not_released");
  }

  const origin = process.env.CEO_MARKETING_X_COMPLETE_INTERNAL_ORIGIN;
  const serviceToken = process.env.CEO_MARKETING_X_COMPLETE_SERVICE_TOKEN;

  // Deliberately distinct from the existing local public Nginx.
  if (
    origin !== "http://ceo-marketing-x-complete-internal:8080" ||
    !serviceToken ||
    serviceToken.length < 32 ||
    /[\\r\\n]/.test(serviceToken)
  ) {
    return reject(503, "x_callback_internal_service_unavailable");
  }

  try {
    const response = await fetch(
      `${origin}/api/marketing/oauth/x/complete`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CEO-Service-Token": serviceToken,
        },
        body: JSON.stringify({
          state,
          code,
          browser_nonce: nonce,
          user_jwt: jwt,
          tenant_id: tenant,
        }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );

    if (response.status !== 200) {
      return reject(503, "x_callback_completion_unavailable");
    }

    const result: unknown = await response.json();

    if (
      !result ||
      typeof result !== "object" ||
      (result as Record<string, unknown>).status !== "connected" ||
      typeof (result as Record<string, unknown>).account_id !== "string"
    ) {
      return reject(503, "x_callback_completion_unavailable");
    }

    const completed = NextResponse.json(
      { status: "connected" },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
        },
      },
    );

    completed.cookies.delete(NONCE_COOKIE);
    return completed;
  } catch {
    return reject(503, "x_callback_completion_unavailable");
  }
}

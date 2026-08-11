import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { type NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // `sign` and `verify` are the fully public, unauthenticated document
  // routes (src/app/sign, src/app/verify) — they carry their own root
  // layouts with no locale segment, so next-intl must never touch them.
  matcher: "/((?!api|trpc|_next|_vercel|sign|verify|.*\\..*).*)",
};

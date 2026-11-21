import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-request Content-Security-Policy with a fresh nonce (security finding F-005).
 *
 * Next.js reads the nonce from the request's CSP header and adds it to its own
 * scripts (framework, page bundles, inline RSC payload), so pages render on the
 * server per request (see `await connection()` in the root layout).
 *
 * - script-src: nonce + 'strict-dynamic' only (no 'unsafe-inline' for scripts).
 * - style-src: 'unsafe-inline' is needed for inline style *attributes* (next/image
 *   positions images with style="..."), which a nonce cannot cover. A nonce in
 *   style-src would also make browsers ignore 'unsafe-inline', so styles use
 *   'self' 'unsafe-inline' only. Style injection cannot run script.
 * - 'unsafe-eval' only in development (React dev tooling); never in production.
 * Other security headers (XFO, nosniff, Referrer-Policy, Permissions-Policy) are set
 * for every route in next.config.ts. HSTS is added by Vercel and left unchanged.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // HTML pages only: skip API routes, Next static/image assets and public files.
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|webmanifest|txt|xml)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

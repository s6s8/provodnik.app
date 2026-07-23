import type { NextRequest } from "next/server";

function resolveExpectedHost(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    return forwardedHost.split(",")[0]?.trim() ?? request.nextUrl.host;
  }

  return request.nextUrl.host;
}

function hostMatchesUrlHost(url: URL, expectedHost: string): boolean {
  return url.host === expectedHost;
}

/**
 * Same-origin guard for state-changing browser POSTs (sign-out CSRF).
 * Requires Origin or Referer to match the public host seen by the app.
 */
export function isSameOriginPost(request: NextRequest): boolean {
  const expectedHost = resolveExpectedHost(request);

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return hostMatchesUrlHost(new URL(origin), expectedHost);
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return hostMatchesUrlHost(new URL(referer), expectedHost);
    } catch {
      return false;
    }
  }

  return process.env.NODE_ENV !== "production";
}

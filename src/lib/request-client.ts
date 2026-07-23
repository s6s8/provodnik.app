import type { NextRequest } from "next/server";

/**
 * Client IP for rate limiting. `x-forwarded-for` is only trusted when the
 * request already carries proxy-forwarded host metadata (Vercel/Caddy). A bare
 * client can otherwise pick any bucket and bypass or spray shared keys.
 */
export function getTrustedClientIp(request: Request | NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!forwardedHost) {
    return "direct";
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return "proxied-unknown";
  }

  const hops = forwardedFor
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return hops[hops.length - 1] ?? "proxied-unknown";
}

export function getMessagesRateLimitKey(userId: string): string {
  return `api:messages:user:${userId}`;
}

import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl, hasSupabaseEnv } from "@/lib/env";

// Behind a reverse proxy (VPS/Vercel) `request.url` can carry the internal
// origin (e.g. localhost:3000), which would send the user to localhost after
// signout. Resolve the public origin from forwarded headers, then fall back to
// the configured site URL, and only lastly to the raw request origin.
function resolveHomeUrl(request: NextRequest): URL {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
    if (host) {
      return new URL("/", `${proto}://${host}`);
    }
  }

  const { origin, hostname } = request.nextUrl;
  const isLocalOrigin = hostname === "localhost" || hostname === "127.0.0.1";

  // A localhost origin in production means we're behind a proxy that didn't
  // forward the public host — never send real users to localhost. In dev we
  // keep the local origin so signout stays on localhost.
  if (isLocalOrigin && process.env.NODE_ENV === "production") {
    return new URL("/", getSiteUrl());
  }

  return new URL("/", origin);
}

export async function POST(request: NextRequest) {
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // Sign out failed — still redirect to clear client state
    }
  }

  return NextResponse.redirect(resolveHomeUrl(request), 303);
}

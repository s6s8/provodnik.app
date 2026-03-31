import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { clientEnv, hasSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export type SupabaseMiddlewareClient = {
  supabase: ReturnType<typeof createServerClient<Database>>;
  applyCookies: (response: NextResponse) => NextResponse;
};

export function createSupabaseMiddlewareClient(
  request: NextRequest,
): SupabaseMiddlewareClient {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const pendingCookies = new Map<string, PendingCookie>();

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL!,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            request.cookies.set(cookie.name, cookie.value);
            pendingCookies.set(cookie.name, cookie);
          }
        },
      },
    },
  );

  function applyCookies(response: NextResponse) {
    for (const cookie of pendingCookies.values()) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }

    return response;
  }

  return {
    supabase,
    applyCookies,
  };
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { clientEnv, hasSupabaseEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  if (!hasSupabaseEnv()) {
    const msg =
      "\n\x1b[31m\x1b[1m[supabase] FATAL: env not configured.\x1b[0m\n" +
      "  NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in .env.local.\n" +
      "  This used to return a silent stub in dev (DEF-005), which masked real auth bugs.\n" +
      "  Run `vercel env pull .env.local` or copy from .env.example to fix.";
    throw new Error(msg);
  }

  const cookieStore = await cookies();

  return createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL!,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    },
  );
}

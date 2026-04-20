import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { clientEnv, hasSupabaseEnv } from "@/lib/env";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

type VerifyType = "email" | "recovery" | "invite";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as VerifyType | null;
  const next = safeRedirectPath(searchParams.get("next"));

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/auth?error=invalid_link", origin));
  }

  if (tokenHash && type) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL!,
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const redirectTo =
        type === "recovery"
          ? new URL("/auth/update-password", origin)
          : new URL(next, origin);

      return NextResponse.redirect(redirectTo);
    }
  }

  return NextResponse.redirect(new URL("/auth?error=invalid_link", origin));
}

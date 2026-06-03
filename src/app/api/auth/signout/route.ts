import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // Sign out failed — still redirect to clear client state
    }
  }

  return NextResponse.redirect(new URL("/", request.url), 303);
}

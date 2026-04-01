import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { getUserThreads } from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json([]);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Требуется авторизация." },
      { status: 401 },
    );
  }

  const threads = await getUserThreads(user.id);
  return NextResponse.json(threads);
}

import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { getUnreadCount } from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ unreadCount: 0, userId: null });
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

  const unreadCount = await getUnreadCount(user.id);

  return NextResponse.json({
    unreadCount,
    userId: user.id,
  });
}

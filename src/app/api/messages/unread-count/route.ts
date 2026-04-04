import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { getUnreadCount } from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  return `api:messages:${ip}`;
}

function withRateLimitHeaders(remaining: number) {
  return {
    "X-RateLimit-Remaining": String(remaining),
  };
}

export async function GET(request: Request) {
  const result = await rateLimit(getClientIdentifier(request), 30, 60);

  if (!result.success) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте через минуту." },
      {
        status: 429,
        headers: withRateLimitHeaders(result.remaining),
      },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { unreadCount: 0, userId: null },
      {
        headers: withRateLimitHeaders(result.remaining),
      },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Требуется авторизация." },
      {
        status: 401,
        headers: withRateLimitHeaders(result.remaining),
      },
    );
  }

  const unreadCount = await getUnreadCount(user.id);

  return NextResponse.json(
    {
      unreadCount,
      userId: user.id,
    },
    {
      headers: withRateLimitHeaders(result.remaining),
    },
  );
}

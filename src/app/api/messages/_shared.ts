import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { getMessagesRateLimitKey } from "@/lib/request-client";
import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MESSAGES_RATE_LIMIT = 30;
const MESSAGES_RATE_WINDOW_SECONDS = 60;

function withRateLimitHeaders(remaining: number) {
  return {
    "X-RateLimit-Remaining": String(remaining),
  };
}

export async function authenticateMessagesRequest() {
  if (!hasSupabaseEnv()) {
    return {
      kind: "disabled" as const,
      remaining: MESSAGES_RATE_LIMIT,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      kind: "unauthorized" as const,
      remaining: MESSAGES_RATE_LIMIT,
    };
  }

  const result = await rateLimit(
    getMessagesRateLimitKey(user.id),
    MESSAGES_RATE_LIMIT,
    MESSAGES_RATE_WINDOW_SECONDS,
  );

  if (!result.success) {
    return {
      kind: "limited" as const,
      remaining: result.remaining,
    };
  }

  return {
    kind: "ok" as const,
    userId: user.id,
    remaining: result.remaining,
  };
}

export function messagesRateLimitResponse(remaining: number) {
  return NextResponse.json(
    { error: "Слишком много запросов. Попробуйте через минуту." },
    {
      status: 429,
      headers: withRateLimitHeaders(remaining),
    },
  );
}

export function messagesUnauthorizedResponse(remaining: number) {
  return NextResponse.json(
    { error: "Требуется авторизация." },
    {
      status: 401,
      headers: withRateLimitHeaders(remaining),
    },
  );
}

export { withRateLimitHeaders };

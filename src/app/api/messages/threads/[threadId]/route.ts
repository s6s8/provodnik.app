import { NextResponse } from "next/server";
import { z } from "zod";

import { hasSupabaseEnv } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { getThreadMessages } from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  threadId: z.string().uuid("Некорректный идентификатор диалога."),
});

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

export async function GET(
  request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
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
    return NextResponse.json([], {
      headers: withRateLimitHeaders(result.remaining),
    });
  }

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json(
      { error: params.error.issues[0]?.message ?? "Некорректный запрос." },
      {
        status: 400,
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

  const messages = await getThreadMessages(params.data.threadId);
  return NextResponse.json(messages, {
    headers: withRateLimitHeaders(result.remaining),
  });
}

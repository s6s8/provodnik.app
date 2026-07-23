import { NextResponse } from "next/server";

import { getUserThreads } from "@/lib/supabase/conversations";
import {
  authenticateMessagesRequest,
  messagesRateLimitResponse,
  messagesUnauthorizedResponse,
  withRateLimitHeaders,
} from "@/app/api/messages/_shared";

export async function GET() {
  const auth = await authenticateMessagesRequest();

  if (auth.kind === "limited") {
    return messagesRateLimitResponse(auth.remaining);
  }

  if (auth.kind === "unauthorized") {
    return messagesUnauthorizedResponse(auth.remaining);
  }

  if (auth.kind === "disabled") {
    return NextResponse.json([], {
      headers: withRateLimitHeaders(auth.remaining),
    });
  }

  const threads = await getUserThreads(auth.userId);
  return NextResponse.json(threads, {
    headers: withRateLimitHeaders(auth.remaining),
  });
}

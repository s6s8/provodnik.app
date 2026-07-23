import { NextResponse } from "next/server";
import { z } from "zod";

import { maskMessageBodies } from "@/lib/pii/mask";
import { getThreadMessages } from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authenticateMessagesRequest,
  messagesRateLimitResponse,
  messagesUnauthorizedResponse,
  withRateLimitHeaders,
} from "@/app/api/messages/_shared";

const paramsSchema = z.object({
  threadId: z.string().uuid("Некорректный идентификатор диалога."),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
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

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json(
      { error: params.error.issues[0]?.message ?? "Некорректный запрос." },
      {
        status: 400,
        headers: withRateLimitHeaders(auth.remaining),
      },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: participant, error: participantError } = await supabase
    .from("thread_participants")
    .select("thread_id")
    .eq("thread_id", params.data.threadId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (participantError || !participant) {
    return NextResponse.json(
      { error: "Диалог не найден." },
      {
        status: 404,
        headers: withRateLimitHeaders(auth.remaining),
      },
    );
  }

  const messages = maskMessageBodies(await getThreadMessages(params.data.threadId));
  return NextResponse.json(messages, {
    headers: withRateLimitHeaders(auth.remaining),
  });
}

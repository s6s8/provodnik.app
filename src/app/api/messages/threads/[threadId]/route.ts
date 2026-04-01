import { NextResponse } from "next/server";
import { z } from "zod";

import { hasSupabaseEnv } from "@/lib/env";
import { getThreadMessages } from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  threadId: z.string().uuid("Некорректный идентификатор диалога."),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json([]);
  }

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json(
      { error: params.error.issues[0]?.message ?? "Некорректный запрос." },
      { status: 400 },
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
      { status: 401 },
    );
  }

  const messages = await getThreadMessages(params.data.threadId);
  return NextResponse.json(messages);
}

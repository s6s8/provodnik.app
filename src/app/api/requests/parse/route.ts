import { NextResponse } from "next/server";
import { z } from "zod";

import {
  COMPLETE_MESSAGE,
  computeMissingRequired,
  mergeFields,
  nextQuestion,
  sanitizeExtraction,
} from "@/features/homepage3/lib/extraction";
import { extractFields } from "@/features/homepage3/lib/openrouter";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  userText: z.string().trim().min(1, "Пустое сообщение.").max(1000),
  accumulatedFields: z.unknown().optional(),
  todayMoscow: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата."),
});

function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
  return `api:requests:parse:${ip}`;
}

export async function POST(request: Request) {
  const limit = await rateLimit(getClientIdentifier(request), 20, 60);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте через минуту." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(limit.remaining) } },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
  }

  // Never trust the client's accumulated state — re-sanitize before use.
  const prior = sanitizeExtraction(body.accumulatedFields ?? {});

  try {
    const extracted = await extractFields({
      priorFields: prior,
      userText: body.userText,
      todayMoscow: body.todayMoscow,
    });
    const fields = mergeFields(prior, extracted);
    const missingRequired = computeMissingRequired(fields);
    const complete = missingRequired.length === 0;

    return NextResponse.json({
      fields,
      missingRequired,
      complete,
      assistantMessage: complete ? COMPLETE_MESSAGE : nextQuestion(missingRequired),
    });
  } catch {
    // LLM transport/parse failure → preserve prior state, friendly fallback.
    const missingRequired = computeMissingRequired(prior);
    return NextResponse.json({
      fields: prior,
      missingRequired,
      complete: false,
      assistantMessage:
        "Не получилось разобрать сообщение. Попробуйте переформулировать или воспользуйтесь обычной формой.",
      llmError: true,
    });
  }
}

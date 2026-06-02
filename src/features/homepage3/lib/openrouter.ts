import "server-only";

import {
  THEME_SLUGS,
  sanitizeExtraction,
  type ExtractedFields,
} from "./extraction";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";
const TIMEOUT_MS = 15_000;

function buildSystemPrompt(todayMoscow: string): string {
  return `Ты — парсер заявок на экскурсию для сервиса «Проводник». Тебе дают РАНЕЕ распознанные поля (JSON) и НОВОЕ сообщение пользователя. Верни СТРОГО JSON (без markdown, без пояснений) — ПОЛНОЕ обновлённое состояние по схеме:
{
 "destination": string|null,        // город/направление как назвал пользователь. Нормализуй: "Мск"->"Москва", "Питер"/"СПб"->"Санкт-Петербург".
 "startDate": string|null,          // ISO YYYY-MM-DD. Разрешай относительные даты от сегодня. Сегодня (Europe/Moscow) = ${todayMoscow}.
 "startTime": string|null,          // "ЧЧ:ММ" если указано время начала
 "endTime": string|null,
 "groupSize": number|null,          // целое число людей; словами тоже ("вдвоём"->2, "пятеро"->5)
 "budgetPerPersonRub": number|null, // бюджет на ОДНОГО человека в рублях, целое ("три тысячи"->3000)
 "interests": string[],             // подмножество из: ${JSON.stringify(THEME_SLUGS)}. Маппинг по смыслу: храмы->religion, музеи/картины->art, еда/гастро->food, парки/природа->nature, дети->kids, необычное/нестандартное->unusual, здания->architecture, прошлое->history. Если интерес не подходит ни под один слаг — НЕ придумывай.
 "requestedLanguages": string[],    // языки экскурсии если указаны: "Русский","Английский" и т.д.
 "notes": string|null               // прочие пожелания
}
ПРАВИЛА:
1. Сохраняй ранее распознанные значения; меняй только то, что уточняет новое сообщение. Никогда не теряй уже указанные поля.
2. ЖЕЛЕЗНО: если значение не указано явно — ставь null (или [] для массивов). НИКОГДА не выдумывай бюджет, дату, число людей, город или тему.
3. Расплывчатое («недорого», «на выходных», «летом») — это НЕ конкретное значение: оставляй null.`;
}

function buildUserMessage(prior: ExtractedFields, userText: string): string {
  return `Ранее распознанные поля:\n${JSON.stringify(prior)}\n\nНовое сообщение пользователя:\n${userText}`;
}

/**
 * Call OpenRouter to extract structured fields from the traveler's free text.
 * Throws on transport / parse failure; the route turns that into a graceful
 * fallback. The returned value is already sanitized.
 */
export async function extractFields(args: {
  priorFields: ExtractedFields;
  userText: string;
  todayMoscow: string;
}): Promise<ExtractedFields> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Provodnik homepage3",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(args.todayMoscow) },
        { role: "user", content: buildUserMessage(args.priorFields, args.userText) },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter responded ${res.status}`);
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("OpenRouter returned no content");

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new Error("OpenRouter returned non-JSON content");
  }

  return sanitizeExtraction(raw);
}

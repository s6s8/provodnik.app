import "server-only";

import {
  THEME_SLUGS,
  sanitizeExtraction,
  type ExtractedFields,
} from "./extraction";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";
const TIMEOUT_MS = 15_000;

const WEEKDAYS_RU = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
] as const;

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + n * 86_400_000);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function dayOfWeek(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Pre-compute relative dates so the model never has to do calendar math. */
function buildDateTable(today: string): string {
  const td = dayOfWeek(today);
  const lines = [
    `сегодня (${WEEKDAYS_RU[td]}) = ${today}`,
    `завтра = ${addDays(today, 1)}`,
    `послезавтра = ${addDays(today, 2)}`,
    `через неделю = ${addDays(today, 7)}`,
    `через две недели = ${addDays(today, 14)}`,
  ];
  for (let wd = 1; wd <= 6; wd++) {
    const offset = ((wd - td + 7) % 7) || 7;
    lines.push(`ближайший(ая) ${WEEKDAYS_RU[wd]} = ${addDays(today, offset)}`);
  }
  const sunOffset = ((0 - td + 7) % 7) || 7;
  lines.push(`ближайшее ${WEEKDAYS_RU[0]} = ${addDays(today, sunOffset)}`);
  return lines.join("\n");
}

function buildSystemPrompt(todayMoscow: string): string {
  return `Ты — парсер заявок на экскурсию для сервиса «Проводник». Тебе дают РАНЕЕ распознанные поля (JSON) и НОВОЕ сообщение пользователя. Верни СТРОГО JSON (без markdown, без пояснений) — ПОЛНОЕ обновлённое состояние по схеме:
{
 "destination": string|null,        // город как назвал пользователь. "Мск"->"Москва", "Питер"/"СПб"->"Санкт-Петербург".
 "startDate": string|null,          // ISO YYYY-MM-DD. Используй ТАБЛИЦУ ДАТ ниже.
 "startTime": string|null,          // "ЧЧ:ММ" если указано время начала ("в 10 утра" -> "10:00")
 "endTime": string|null,
 "groupSize": number|null,          // целое число людей
 "budgetPerPersonRub": number|null, // бюджет на ОДНОГО человека в рублях, целое ("три тысячи"->3000)
 "interests": string[],             // подмножество из: ${JSON.stringify(THEME_SLUGS)}
 "requestedLanguages": string[],    // языки экскурсии если указаны: "Русский","Английский" и т.д.
 "notes": string|null               // прочие пожелания
}
МАППИНГ ТЕМ (по смыслу):
- история/прошлое/исторические места -> history
- архитектура/здания/дома/особняки -> architecture
- природа/парки/сады/пейзажи -> nature
- еда/гастрономия/кухня/рестораны/местная кухня -> food
- искусство/картины/музеи/галереи/выставки/скульптура -> art
- религия/храмы/церкви/соборы/мечети/монастыри -> religion
- дети/семейное/для детей/с детьми -> kids
- необычное/нестандартное/секретные/странные места -> unusual
Если тема не подходит ни под один слаг — НЕ придумывай слаг.
ЧИСЛО ЛЮДЕЙ словами: один->1, вдвоём/двое->2, втроём/трое->3, вчетвером/четверо->4, впятером/пятеро->5, вшестером/шестеро->6, "нас N"->N.
ТАБЛИЦА ДАТ (Europe/Moscow):
${buildDateTable(todayMoscow)}
Если назван конкретный день недели или относительная дата из таблицы — ОБЯЗАТЕЛЬНО подставь точную дату из таблицы.
ПРАВИЛА:
1. Сохраняй ранее распознанные значения; меняй только то, что уточняет новое сообщение. Никогда не теряй уже указанные поля.
2. ЖЕЛЕЗНО: если значение не указано явно — ставь null (или [] для массивов). НИКОГДА не выдумывай бюджет, число людей, город или тему.
3. Дату оставляй null ТОЛЬКО если она не указана вовсе или расплывчата («летом», «осенью», «на выходных» без конкретного дня).`;
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

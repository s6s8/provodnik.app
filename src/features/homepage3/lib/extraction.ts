import { z } from "zod";

import { THEMES, type ThemeSlug } from "@/data/themes";

/** Theme slugs the LLM is allowed to emit. */
export const THEME_SLUGS = THEMES.map((t) => t.slug) as ThemeSlug[];

/**
 * Structured fields extracted from a traveler's free-text request.
 * `null` / `[]` means "not stated yet" — never a guessed default (CLAUDE.md §10).
 */
export type ExtractedFields = {
  destination: string | null;
  startDate: string | null; // ISO YYYY-MM-DD
  startTime: string | null; // HH:MM
  endTime: string | null; // HH:MM
  groupSize: number | null;
  budgetPerPersonRub: number | null;
  interests: ThemeSlug[];
  requestedLanguages: string[];
  notes: string | null;
};

export const EMPTY_FIELDS: ExtractedFields = {
  destination: null,
  startDate: null,
  startTime: null,
  endTime: null,
  groupSize: null,
  budgetPerPersonRub: null,
  interests: [],
  requestedLanguages: [],
  notes: null,
};

export const REQUIRED_FIELDS = [
  "destination",
  "startDate",
  "groupSize",
  "budgetPerPersonRub",
  "interests",
] as const;
export type RequiredField = (typeof REQUIRED_FIELDS)[number];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{1,2}:\d{2}$/;
const THEME_SET = new Set<string>(THEME_SLUGS);

/** Lenient schema for the raw JSON the LLM returns — cleaned by {@link sanitizeExtraction}. */
const llmExtractionSchema = z
  .object({
    destination: z.string().nullish(),
    startDate: z.string().nullish(),
    startTime: z.string().nullish(),
    endTime: z.string().nullish(),
    groupSize: z.number().nullish(),
    budgetPerPersonRub: z.number().nullish(),
    interests: z.array(z.string()).nullish(),
    requestedLanguages: z.array(z.string()).nullish(),
    notes: z.string().nullish(),
  })
  .passthrough();

function dedupe<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function normalizeTime(s: string): string | null {
  if (!TIME_RE.test(s)) return null;
  const [h, m] = s.split(":");
  const hh = String(Math.min(23, Math.max(0, Number(h)))).padStart(2, "0");
  return `${hh}:${m}`;
}

function positiveInt(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  return n > 0 ? n : null;
}

/**
 * Turn raw, untrusted LLM/client JSON into a clean {@link ExtractedFields}.
 * Drops unknown theme slugs, validates date/time formats, and coerces numbers —
 * but never invents or clamps a value the user didn't provide.
 */
export function sanitizeExtraction(raw: unknown): ExtractedFields {
  const parsed = llmExtractionSchema.safeParse(raw);
  const d = parsed.success ? parsed.data : {};

  const destination =
    typeof d.destination === "string" && d.destination.trim()
      ? d.destination.trim().slice(0, 80)
      : null;
  const notes =
    typeof d.notes === "string" && d.notes.trim() ? d.notes.trim().slice(0, 800) : null;

  return {
    destination,
    startDate:
      typeof d.startDate === "string" && DATE_RE.test(d.startDate.trim())
        ? d.startDate.trim()
        : null,
    startTime: typeof d.startTime === "string" ? normalizeTime(d.startTime.trim()) : null,
    endTime: typeof d.endTime === "string" ? normalizeTime(d.endTime.trim()) : null,
    groupSize: positiveInt(d.groupSize),
    budgetPerPersonRub: positiveInt(d.budgetPerPersonRub),
    interests: Array.isArray(d.interests)
      ? dedupe(d.interests.filter((s): s is ThemeSlug => THEME_SET.has(s)))
      : [],
    requestedLanguages: Array.isArray(d.requestedLanguages)
      ? dedupe(
          d.requestedLanguages
            .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
            .map((s) => s.trim()),
        )
      : [],
    notes,
  };
}

/**
 * Merge a fresh extraction onto prior state. A non-null / non-empty incoming
 * value wins; otherwise the prior value is preserved so the conversation never
 * loses a field the user already gave.
 */
export function mergeFields(prior: ExtractedFields, incoming: ExtractedFields): ExtractedFields {
  return {
    destination: incoming.destination ?? prior.destination,
    startDate: incoming.startDate ?? prior.startDate,
    startTime: incoming.startTime ?? prior.startTime,
    endTime: incoming.endTime ?? prior.endTime,
    groupSize: incoming.groupSize ?? prior.groupSize,
    budgetPerPersonRub: incoming.budgetPerPersonRub ?? prior.budgetPerPersonRub,
    interests: incoming.interests.length ? incoming.interests : prior.interests,
    requestedLanguages: incoming.requestedLanguages.length
      ? incoming.requestedLanguages
      : prior.requestedLanguages,
    notes: incoming.notes ?? prior.notes,
  };
}

/** Which required fields are still missing, in ask-priority order. */
export function computeMissingRequired(f: ExtractedFields): RequiredField[] {
  const missing: RequiredField[] = [];
  if (!f.destination) missing.push("destination");
  if (!f.startDate) missing.push("startDate");
  if (!f.groupSize || f.groupSize < 1) missing.push("groupSize");
  if (!f.budgetPerPersonRub || f.budgetPerPersonRub < 1) missing.push("budgetPerPersonRub");
  if (!f.interests.length) missing.push("interests");
  return missing;
}

export function isComplete(f: ExtractedFields): boolean {
  return computeMissingRequired(f).length === 0;
}

const QUESTIONS: Record<RequiredField, string> = {
  destination: "Куда хотите поехать?",
  startDate: "На какую дату планируете поездку?",
  groupSize: "Сколько вас человек?",
  budgetPerPersonRub: "Какой бюджет на одного человека, в рублях?",
  interests: "Что вам интересно? Например: история, гастрономия, архитектура, природа…",
};

export const COMPLETE_MESSAGE = "Готово! Проверьте детали ниже и отправьте запрос гидам.";

export const INITIAL_MESSAGE =
  "Куда, когда, сколько вас и бюджет — одним сообщением.";

/** The next single question to ask, or `null` when nothing required is missing. */
export function nextQuestion(missing: RequiredField[]): string | null {
  if (!missing.length) return null;
  return QUESTIONS[missing[0]];
}

/**
 * requests.ts — Traveler request CRUD service layer (server-only)
 *
 * All functions use createSupabaseServerClient and are intended for Server
 * Components and Server Actions only. Never import this file from client
 * components.
 *
 * travelerId is always derived from the authenticated session — never accepted
 * from client input.
 */

import { z } from "zod";

import {
  MAX_REQUEST_PARTICIPANTS,
  MAX_REQUEST_PARTICIPANTS_MESSAGE,
} from "@/data/traveler-request/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TravelerRequestRow, Uuid } from "@/lib/supabase/types";
import { sanitizeTravelerRequestDestinationLabel } from "@/lib/traveler-request-destination";

// ---------------------------------------------------------------------------
// Input schema (server-side validation)
// ---------------------------------------------------------------------------

export const createRequestInputSchema = z
  .object({
    destination: z
      .string()
      .transform((value) =>
        sanitizeTravelerRequestDestinationLabel(value, { fallback: false }),
      )
      .pipe(
        z
          .string()
          .min(2, "Укажите направление (минимум 2 символа).")
          .max(80, "Направление не должно превышать 80 символов."),
      ),
    interests: z.array(z.string()).default([]),
    requested_languages: z.array(z.string()).default([]),
    starts_on: z.string().min(1, "Укажите дату начала."),
    ends_on: z.string().min(1, "Укажите дату окончания."),
    budget_minor: z
      .number()
      .int("Используйте целое число.")
      .min(1_000, "Бюджет должен быть не менее 1 000 ₽.")
      .max(200_000_000, "Бюджет слишком велик для MVP.")
      .nullable()
      .optional(),
    participants_count: z
      .number()
      .int("Используйте целое число.")
      .min(1, "Минимум 1 путешественник.")
      .max(MAX_REQUEST_PARTICIPANTS, MAX_REQUEST_PARTICIPANTS_MESSAGE)
      .default(1),
    format_preference: z.enum(["private", "group"]).nullable().optional(),
    notes: z
      .string()
      .trim()
      .max(800, "Пожелания не должны превышать 800 символов.")
      .nullable()
      .optional(),
    open_to_join: z.boolean().default(false),
    allow_guide_suggestions: z.boolean().default(true),
    group_capacity: z
      .number()
      .int()
      .min(1)
      .nullable()
      .optional(),
    region: z.string().trim().max(80).nullable().optional(),
    preferred_guide_slug: z
      .string()
      .trim()
      .max(120)
      .regex(/^\S+$/, "Некорректный идентификатор гида.")
      .nullable()
      .optional(),
    start_time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Формат времени: ЧЧ:ММ")
      .nullable()
      .optional(),
    end_time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Формат времени: ЧЧ:ММ")
      .nullable()
      .optional(),
    date_flexibility: z.enum(['exact', 'few_days']).default('exact'),
    date_locked: z.boolean().optional(),
    time_locked: z.boolean().optional(),
    count_locked: z.boolean().optional(),
    budget_locked: z.boolean().optional(),
    date_window: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.starts_on);
    const end = new Date(value.ends_on);

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["starts_on"],
        message: "Дата начала указана неверно.",
      });
    }

    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["ends_on"],
        message: "Дата окончания указана неверно.",
      });
    }

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      if (end.getTime() < start.getTime()) {
        ctx.addIssue({
          code: "custom",
          path: ["ends_on"],
          message: "Дата окончания должна быть не раньше даты начала.",
        });
      }
    }
  });

export type CreateRequestInput = z.input<typeof createRequestInputSchema>;

// ---------------------------------------------------------------------------
// Return type (mirrors TravelerRequestRow)
// ---------------------------------------------------------------------------

export type TravelerRequest = TravelerRequestRow;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SELECT_COLS =
  "id, traveler_id, destination, region, interests, requested_languages, starts_on, ends_on, start_time, end_time, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at, date_locked, time_locked, count_locked, budget_locked, date_window, preferred_guide_slug, target_guide_id";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new traveler request.
 * Validates input with Zod. travelerId must come from the auth context.
 */
export async function createTravelerRequest(
  data: CreateRequestInput,
  travelerId: Uuid,
): Promise<TravelerRequest> {
  const input = createRequestInputSchema.parse(data);
  const supabase = await createSupabaseServerClient();

  // Resolve the display-only guide slug to a real FK server-side (item 8). When set,
  // target_guide_id makes the request private to that guide; the slug is never trusted
  // for privacy. An unresolvable slug leaves the request open (edge case — the CTA only
  // ever passes real guide slugs).
  let targetGuideId: string | null = null;
  if (input.preferred_guide_slug) {
    const { data: guide } = await supabase
      .from("guide_profiles")
      .select("user_id")
      .eq("slug", input.preferred_guide_slug)
      .maybeSingle();
    targetGuideId = (guide?.user_id as string | undefined) ?? null;
  }

  const { data: row, error } = await supabase
    .from("traveler_requests")
    .insert({
      traveler_id: travelerId,
      target_guide_id: targetGuideId,
      destination: input.destination,
      region: input.region ?? null,
      interests: input.interests,
      requested_languages: input.requested_languages ?? [],
      starts_on: input.starts_on,
      ends_on: input.ends_on,
      budget_minor: input.budget_minor ?? null,
      currency: "RUB",
      participants_count: input.participants_count,
      format_preference: input.format_preference ?? null,
      notes: input.notes?.trim() || null,
      open_to_join: input.open_to_join,
      // form-epic #14: omit allow_guide_suggestions from insert; rely on
      // DB column default. Closes bug 7 deterministically (prod schema-cache miss).
      // allow_guide_suggestions: input.allow_guide_suggestions,
      group_capacity: input.group_capacity ?? null,
      preferred_guide_slug: input.preferred_guide_slug ?? null,
      start_time: input.start_time ?? null,
      end_time: input.end_time ?? null,
      date_flexibility: input.date_flexibility,
      date_locked: input.date_locked ?? true,
      time_locked: input.time_locked ?? true,
      count_locked: input.count_locked ?? true,
      budget_locked: input.budget_locked ?? true,
      date_window: input.date_window ?? "week",
    })
    .select(SELECT_COLS)
    .single();

  if (error) throw error;
  return row as TravelerRequest;
}

/**
 * Fetch a single traveler request by ID.
 * Returns null if not found.
 */
export async function getTravelerRequest(id: Uuid): Promise<TravelerRequest | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("traveler_requests")
    .select(SELECT_COLS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return (data as TravelerRequest | null) ?? null;
}

/**
 * Fetch all requests for a given traveler, ordered by most recently updated.
 */
export async function getTravelerRequests(travelerId: Uuid): Promise<TravelerRequest[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("traveler_requests")
    .select(SELECT_COLS)
    .eq("traveler_id", travelerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data as TravelerRequest[]) ?? [];
}

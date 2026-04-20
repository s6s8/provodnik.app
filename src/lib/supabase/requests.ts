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

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TravelerRequestRow, Uuid } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Input schema (server-side validation)
// ---------------------------------------------------------------------------

export const createRequestInputSchema = z
  .object({
    destination: z
      .string()
      .trim()
      .min(2, "Укажите направление (минимум 2 символа).")
      .max(80, "Направление не должно превышать 80 символов."),
    category: z.enum(["city", "nature", "culture", "food", "adventure", "relax", "religion"]),
    starts_on: z.string().min(1, "Укажите дату начала."),
    ends_on: z.string().min(1, "Укажите дату окончания."),
    budget_minor: z
      .number()
      .int("Используйте целое число.")
      .min(1_000, "Бюджет должен быть не менее 1 000 ₽.")
      .max(2_000_000, "Бюджет слишком велик для MVP.")
      .nullable()
      .optional(),
    participants_count: z
      .number()
      .int("Используйте целое число.")
      .min(1, "Минимум 1 путешественник.")
      .max(20, "Максимум 20 путешественников.")
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

export type CreateRequestInput = z.infer<typeof createRequestInputSchema>;

// ---------------------------------------------------------------------------
// Return type (mirrors TravelerRequestRow)
// ---------------------------------------------------------------------------

export type TravelerRequest = TravelerRequestRow;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SELECT_COLS =
  "id, traveler_id, destination, region, category, starts_on, ends_on, start_time, end_time, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at";

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

  const { data: row, error } = await supabase
    .from("traveler_requests")
    .insert({
      traveler_id: travelerId,
      destination: input.destination,
      region: input.region ?? null,
      category: input.category,
      starts_on: input.starts_on,
      ends_on: input.ends_on,
      budget_minor: input.budget_minor ?? null,
      currency: "RUB",
      participants_count: input.participants_count,
      format_preference: input.format_preference ?? null,
      notes: input.notes?.trim() || null,
      open_to_join: input.open_to_join,
      allow_guide_suggestions: input.allow_guide_suggestions,
      group_capacity: input.group_capacity ?? null,
      start_time: input.start_time ?? null,
      end_time: input.end_time ?? null,
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

/**
 * Fetch all open requests — used by the guide inbox in Wave 2.
 */
export async function getOpenRequests(): Promise<TravelerRequest[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("traveler_requests")
    .select(SELECT_COLS)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as TravelerRequest[]) ?? [];
}

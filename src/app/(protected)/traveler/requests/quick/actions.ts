"use server";

import { redirect } from "next/navigation";

import { rubToKopecks } from "@/data/money";
import { hasSupabaseEnv } from "@/lib/env";
import { createTravelerRequest } from "@/lib/supabase/requests";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DurationKey = "1-2d" | "3-5d" | "7d" | "14d";
type CompanionKey = "solo" | "pair" | "friends" | "kids" | "group";

const DURATION_DAYS: Record<DurationKey, number> = {
  "1-2d": 1,
  "3-5d": 3,
  "7d": 7,
  "14d": 14,
};

const COMPANION_MAP: Record<CompanionKey, {
  participants_count: number;
  open_to_join: boolean;
  format_preference: "private" | "group";
}> = {
  solo:    { participants_count: 1, open_to_join: false, format_preference: "private" },
  pair:    { participants_count: 2, open_to_join: false, format_preference: "private" },
  friends: { participants_count: 3, open_to_join: true,  format_preference: "group" },
  kids:    { participants_count: 2, open_to_join: false, format_preference: "private" },
  group:   { participants_count: 4, open_to_join: true,  format_preference: "group" },
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export type QuickRequestState = { error: string | null };

export async function createQuickRequestAction(
  _prev: QuickRequestState,
  formData: FormData,
): Promise<QuickRequestState> {
  const destination = ((formData.get("destination") as string) ?? "").trim();
  const duration = (formData.get("duration") as string) as DurationKey | "custom" | "";
  const companion = ((formData.get("companion") as string) ?? "pair") as CompanionKey;
  const customStart = (formData.get("customStart") as string | null) ?? null;
  const customEnd = (formData.get("customEnd") as string | null) ?? null;

  if (!destination) return { error: "Укажите направление" };

  const baseDate = addDays(new Date(), 14);
  let starts_on: string;
  let ends_on: string;

  if (duration === "custom" && customStart && customEnd) {
    starts_on = customStart;
    ends_on = customEnd;
  } else {
    const days = DURATION_DAYS[duration as DurationKey] ?? 3;
    starts_on = toISODate(baseDate);
    ends_on = toISODate(addDays(baseDate, days));
  }

  const companionConfig = COMPANION_MAP[companion] ?? COMPANION_MAP.pair;

  if (!hasSupabaseEnv()) return { error: "Supabase не настроен." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Необходимо войти в систему." };

  let requestId: string;
  try {
    const record = await createTravelerRequest(
      {
        destination,
        interests: [],
        starts_on,
        ends_on,
        start_time: null,
        end_time: null,
        budget_minor: 0,
        participants_count: companionConfig.participants_count,
        format_preference: companionConfig.format_preference,
        notes: null,
        open_to_join: companionConfig.open_to_join,
        allow_guide_suggestions: true,
        group_capacity: null,
        region: null,
      },
      user.id,
    );
    requestId = record.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка.";
    return { error: `Не удалось сохранить запрос: ${message}` };
  }

  redirect(`/traveler/requests/${requestId}/sent`);
}

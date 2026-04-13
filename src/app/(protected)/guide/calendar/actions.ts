"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BlockSlotResult = { ok: true; id: string } | { ok: false; error: string };
export type UnblockSlotResult = { ok: true } | { ok: false; error: string };

export async function blockSlotAction(
  listingId: string,
  date: string,
  timeStart: string,
  timeEnd: string,
): Promise<BlockSlotResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Требуется вход" };

  const { data: listing } = await supabase
    .from("listings")
    .select("id, guide_id")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.guide_id !== user.id)
    return { ok: false, error: "Нет доступа к этому туру" };

  const { data, error } = await supabase
    .from("listing_schedule_extras")
    .insert({ listing_id: listingId, date, time_start: timeStart, time_end: timeEnd })
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Не удалось создать запись" };
  return { ok: true, id: data.id };
}

export async function unblockSlotAction(extraId: string): Promise<UnblockSlotResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Требуется вход" };

  const { error } = await supabase
    .from("listing_schedule_extras")
    .delete()
    .eq("id", extraId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function blockDayAction(
  listingId: string,
  date: string,
): Promise<{ ok: boolean; error?: string; count?: number }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Требуется вход" };

  const { data: listing } = await supabase
    .from("listings")
    .select("id, guide_id")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.guide_id !== user.id)
    return { ok: false, error: "Нет доступа к этому туру" };

  const slots: Array<{
    listing_id: string;
    date: string;
    time_start: string;
    time_end: string;
  }> = [];

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const endM = (m + 30) % 60;
      const endH = m + 30 >= 60 ? h + 1 : h;
      const eh = String(endH).padStart(2, "0");
      const em = String(endM).padStart(2, "0");
      slots.push({
        listing_id: listingId,
        date,
        time_start: `${hh}:${mm}:00`,
        time_end: `${eh}:${em}:00`,
      });
    }
  }

  const { error } = await supabase.from("listing_schedule_extras").upsert(slots, {
    onConflict: "listing_id,date,time_start",
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, count: slots.length };
}

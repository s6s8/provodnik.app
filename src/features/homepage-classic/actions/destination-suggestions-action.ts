"use server";

import { getDestinationSuggestions } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/create-action";
import type { DestinationOption } from "@/data/supabase/queries";

/** Loads the full combobox vocabulary after first paint instead of serializing it into the homepage RSC payload. */
export async function fetchDestinationSuggestionsAction(): Promise<
  ActionResult<DestinationOption[]>
> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await getDestinationSuggestions(supabase);
    if (error) return { ok: false, error: "Не удалось загрузить направления." };
    return { ok: true, data: data ?? [] };
  } catch {
    return { ok: false, error: "Не удалось загрузить направления." };
  }
}

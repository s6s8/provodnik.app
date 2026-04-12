"use client";

import { useCallback, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListingRow } from "@/lib/supabase/types";

type AutosaveState = "idle" | "saving" | "saved" | "error";

export function useAutosave(listingId: string, userId: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<AutosaveState>("idle");

  const save = useCallback(
    (patch: Partial<ListingRow>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        setState("saving");
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase
          .from("listings")
          .update(patch)
          .eq("id", listingId)
          .eq("guide_id", userId);
        setState(error ? "error" : "saved");
      }, 2000);
    },
    [listingId, userId],
  );

  return { save, autosaveState: state };
}

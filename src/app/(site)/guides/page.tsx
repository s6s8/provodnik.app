import type { Metadata } from "next";

import { PublicGuidesGrid } from "@/features/guide/components/public/public-guides-grid";
import { getGuides, type GuideRecord } from "@/data/supabase/queries";
import { INTEREST_CHIPS } from "@/data/interests";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function generateMetadata(): Metadata {
  return {
    title: "Гиды",
    description: "Найдите опытного гида для вашего путешествия",
  };
}

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ spec?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const validSpecs = new Set<string>(INTEREST_CHIPS.map((c) => c.id));
  const activeSpecs = (sp?.spec ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && validSpecs.has(s));

  const trimmedQ = (sp.q ?? "").trim();
  const rawQ = trimmedQ.length === 0 ? undefined : trimmedQ;
  const cappedForFilter = rawQ ? rawQ.slice(0, 80) : undefined;

  let guides: GuideRecord[] = [];
  let loadError = false;

  const auth = await readAuthContextFromServer();
  try {
    const supabase = await createSupabaseServerClient();
    const result = await getGuides(supabase, {
      specializations: activeSpecs,
      ...(cappedForFilter ? { q: cappedForFilter } : {}),
    });
    if (result.error) loadError = true;
    else guides = result.data ?? [];
  } catch {
    loadError = true;
  }

  return (
    <PublicGuidesGrid
      guides={guides}
      activeSpecs={activeSpecs}
      initialQ={sp.q?.trim() ?? ""}
      loadError={loadError}
      showGuideCta={auth.role !== "guide"}
    />
  );
}

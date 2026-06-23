import type { Metadata } from "next";
import { Users } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
    <section className="bg-surface pt-[110px] pb-20">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        {loadError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Не удалось загрузить гидов. Попробуйте обновить страницу.
            </AlertDescription>
          </Alert>
        ) : guides.length === 0 && activeSpecs.length === 0 && !rawQ ? (
          <EmptyState
            icon={Users}
            title="Пока нет гидов"
            description="В этом разделе пока пусто. Если вы гид — добавьте свой профиль, и путешественники найдут вас."
          />
        ) : (
          <PublicGuidesGrid
            guides={guides}
            activeSpecs={activeSpecs}
            initialQ={sp.q?.trim() ?? ""}
          />
        )}

        {auth.role !== "guide" && (
          <section className="mt-16 rounded-2xl border border-border/60 bg-muted/40 px-8 py-10 text-center">
            <h2 className="font-display text-2xl font-semibold">Вы гид?</h2>
            <p className="mt-2 mx-auto max-w-xl text-base text-muted-foreground">
              Присоединяйтесь к Provodnik — показывайте свои маршруты путешественникам со всей России.
            </p>
            <Button asChild className="mt-6">
              <Link href="/become-a-guide">Стать гидом</Link>
            </Button>
          </section>
        )}
      </div>
    </section>
  );
}

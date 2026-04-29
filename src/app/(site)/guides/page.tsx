import type { Metadata } from "next";
import { Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PublicGuidesGrid } from "@/features/guide/components/public/public-guides-grid";
import { getGuides, type GuideRecord } from "@/data/supabase/queries";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function generateMetadata(): Metadata {
  return {
    title: "Гиды",
    description: "Найдите опытного гида для вашего путешествия",
  };
}

export default async function GuidesPage() {
  let guides: GuideRecord[] = [];

  const auth = await readAuthContextFromServer();
  try {
    const supabase = await createSupabaseServerClient();
    const result = await getGuides(supabase);
    if (result.data) guides = result.data;
  } catch {
    // guides stays []
  }

  return (
    <section className="bg-surface pt-[110px] pb-20">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">Проводники</p>
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] text-on-surface mb-4">
          Местные знатоки
        </h1>
        <p className="max-w-[46rem] mb-12 text-base leading-[1.7] text-on-surface-muted">
          Местные гиды, которые превращают маршрут в историю.
        </p>

        {guides.length === 0 ? (
          <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass flex flex-col items-center justify-center rounded-[1.5rem] px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-light text-brand">
              <Users className="size-6" strokeWidth={1.9} />
            </span>
            <h2 className="mt-5 text-[1.35rem] font-semibold text-ink">Пока нет гидов</h2>
            <p className="mt-2 max-w-[30rem] text-[0.95rem] leading-7 text-ink-2">
              В этом разделе пока пусто. Если вы гид — добавьте свой профиль, и путешественники найдут вас.
            </p>
          </div>
        ) : (
          <PublicGuidesGrid guides={guides} />
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

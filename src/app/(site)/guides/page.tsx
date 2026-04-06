import type { Metadata } from "next";
import { Users } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getGuides, type GuideRecord } from "@/data/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function generateMetadata(): Metadata {
  return {
    title: "Гиды",
    description: "Найдите опытного гида для вашего путешествия",
  };
}

export default async function GuidesPage() {
  let guides: GuideRecord[] = [];

  const supabase = await createSupabaseServerClient();
  const result = await getGuides(supabase);
  if (result.data) guides = result.data;

  return (
    <section className="bg-surface pt-[110px] pb-20">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">Проводники</p>
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] text-on-surface mb-4">
          Местные знатоки
        </h1>
        <p className="max-w-[46rem] mb-12 text-base leading-[1.7] text-on-surface-muted">
          Гиды, которые превращают маршрут в историю. Каждый проверен и имеет живые отзывы путешественников.
        </p>

        {guides.length === 0 && (
          <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass flex flex-col items-center justify-center rounded-[1.5rem] px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-light text-brand">
              <Users className="size-6" strokeWidth={1.9} />
            </span>
            <h2 className="mt-5 text-[1.35rem] font-semibold text-ink">Гиды скоро появятся</h2>
            <p className="mt-2 max-w-[30rem] text-[0.95rem] leading-7 text-ink-2">
              Мы подбираем лучших местных знатоков. Совсем скоро здесь появятся проверенные гиды с живыми отзывами.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="block bg-surface-high rounded-card p-6 shadow-card transition-transform hover:-translate-y-[3px] no-underline text-inherit"
            >
              <div className="mb-4 flex items-center gap-4">
                <Avatar className="size-14">
                  <AvatarImage src={guide.avatarUrl ?? undefined} alt={guide.fullName} />
                  <AvatarFallback className="bg-surface-low text-base font-semibold text-primary">
                    {guide.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold text-on-surface">{guide.fullName}</p>
                  <p className="text-[0.8125rem] text-on-surface-muted">{guide.homeBase}</p>
                </div>
              </div>

              <p className="mb-4 line-clamp-2 text-[0.875rem] leading-[1.55] text-on-surface-muted">
                {guide.bio}
              </p>

              <p className="text-[0.8125rem] text-on-surface-muted">
                ★ {guide.rating} · {guide.reviewCount} отзывов
              </p>
            </Link>
          ))}
        </div>

        <section className="mt-16 rounded-2xl border border-border/60 bg-muted/40 px-8 py-10 text-center">
          <h2 className="font-display text-2xl font-semibold">Вы гид?</h2>
          <p className="mt-2 mx-auto max-w-xl text-base text-muted-foreground">
            Присоединяйтесь к Provodnik — показывайте свои маршруты путешественникам со всей России.
          </p>
          <Button asChild className="mt-6">
            <Link href="/auth?role=guide">Стать гидом</Link>
          </Button>
        </section>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGuides, type GuideRecord } from "@/data/supabase/queries";

export function generateMetadata(): Metadata {
  return {
    title: "Гиды",
    description: "Найдите опытного гида для вашего путешествия",
  };
}

export default async function GuidesPage() {
  let guides: GuideRecord[] = [];

  const result = await getGuides(null as any);
  if (result.data) guides = result.data;

  return (
    <section className="bg-surface pt-[110px] pb-20">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">Проводники</p>
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] text-[var(--on-surface)] mb-4">
          Местные знатоки
        </h1>
        <p className="max-w-[46rem] mb-12 text-base leading-[1.7] text-[var(--on-surface-muted)]">
          Гиды, которые превращают маршрут в историю. Каждый проверен и имеет живые отзывы путешественников.
        </p>

        {guides.length === 0 && (
          <p className="text-[var(--on-surface-muted)]">Пока нет доступных гидов.</p>
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
                  <p className="text-base font-semibold text-[var(--on-surface)]">{guide.fullName}</p>
                  <p className="text-[0.8125rem] text-[var(--on-surface-muted)]">{guide.homeBase}</p>
                </div>
              </div>

              <p className="mb-4 line-clamp-2 text-[0.875rem] leading-[1.55] text-[var(--on-surface-muted)]">
                {guide.bio}
              </p>

              <p className="text-[0.8125rem] text-[var(--on-surface-muted)]">
                ★ {guide.rating} · {guide.reviewCount} отзывов
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

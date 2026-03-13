import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { seededPublicListings } from "@/data/public-listings/seed";
import { FoundationGrid } from "@/features/home/components/foundation-grid";
import { LayoutGridShowcase } from "@/features/home/components/layout-grid-showcase";
import { PainPointsGrid } from "@/features/home/components/pain-points-grid";
import { WorkstreamsGrid } from "@/features/home/components/workstreams-grid";
import { PublicListingCard } from "@/features/listings/components/public/public-listing-card";

export function Page2HomePage() {
  return (
    <>
      <LayoutGridShowcase />
      <section className="section-frame rounded-[2.2rem] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Экскурсии, которые хочется сохранить
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl">
                Бронируйте впечатления, а не читайте длинные обещания.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                На главной сразу видно атмосферу маршрутов, географию, формат и подачу гида.
                Provodnik помогает быстро перейти от вдохновения к реальному бронированию
                экскурсии по России.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/listings">
                  Смотреть каталог
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href="/traveler">Оставить заявку под даты</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <CompactFactCard
              title="Готовые направления"
              description="Ростов, Азов, Байкал, Карелия, Казань и другие города для старта."
            />
            <CompactFactCard
              title="Форматы под группу"
              description="Пары, семьи, друзья и маленькие компании без ощущения туристического конвейера."
            />
            <CompactFactCard
              title="Честное бронирование"
              description="Отзывы, условия отмены и профиль гида видны до оформления заявки."
            />
          </div>
        </div>
      </section>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="editorial-kicker">Подборка недели</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Готовые маршруты, с которых удобно начать знакомство с сервисом
            </h2>
          </div>
          <Button asChild variant="outline" className="rounded-full px-5">
            <Link href="/listings">
              Весь каталог
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {seededPublicListings.map((listing) => (
            <PublicListingCard key={listing.slug} listing={listing} />
          ))}
        </div>
      </section>
      <PainPointsGrid />
      <FoundationGrid />
      <WorkstreamsGrid />
    </>
  );
}

function CompactFactCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.6rem] border border-border/70 bg-white/78 p-5">
      <p className="text-lg font-semibold tracking-tight text-foreground">{title}</p>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
    </article>
  );
}

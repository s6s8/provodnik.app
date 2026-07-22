import Link from "next/link";
import { Clock3, MapPin, Users } from "lucide-react";

import { formatExcursionPriceFrom } from "@/components/listing-detail/excursion-price";
import { ImmersiveHero } from "@/components/shared/immersive-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PublicGuideTemplateDetail } from "@/lib/supabase/guide-template-listings";

export function ReadyExcursionDetail({ detail }: { detail: PublicGuideTemplateDetail }) {
  const priceLabel =
    detail.priceFromKopecks == null
      ? "Цена по запросу"
      : formatExcursionPriceFrom(
          detail.priceFromKopecks,
          "group",
          detail.maxParticipants,
          detail.priceScope,
        );
  // Carry the template, not just its guide: the request pipeline resolves the addressee
  // and freezes the itinerary snapshot from this id, so the booking it eventually becomes
  // still shows *this* excursion's programme. The slug stays for the "Запрос гиду: …" chip.
  const requestHref = `/?guide=${encodeURIComponent(detail.guide.slug)}&template=${encodeURIComponent(detail.id)}`;

  return (
    <div className="pb-28 md:pb-12">
      <ImmersiveHero
        imageUrl={detail.photoUrl}
        imagePosition="center 44%"
        breadcrumb={[
          { label: "Экскурсии", href: "/listings" },
          ...(detail.region ? [{ label: detail.region }] : []),
          { label: detail.title, current: true },
        ]}
        title={detail.title}
        statusBadge={
          <span className="inline-flex rounded-full border border-white/30 bg-black/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            Готовая экскурсия
          </span>
        }
        variant="compact"
      />

      <div className="mx-auto mt-8 grid w-full max-w-page gap-8 px-[clamp(20px,4vw,48px)] lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          {detail.description ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-tight">Об экскурсии</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {detail.description}
              </p>
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Детали</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              {detail.durationText ? (
                <div className="flex gap-3 rounded-card border border-line bg-surface p-4">
                  <Clock3 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Длительность</dt>
                    <dd className="mt-0.5 text-sm font-medium">{detail.durationText}</dd>
                  </div>
                </div>
              ) : null}
              {detail.maxParticipants && detail.maxParticipants > 0 ? (
                <div className="flex gap-3 rounded-card border border-line bg-surface p-4">
                  <Users className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Размер группы</dt>
                    <dd className="mt-0.5 text-sm font-medium">
                      до {detail.maxParticipants} человек
                    </dd>
                  </div>
                </div>
              ) : null}
              {detail.region ? (
                <div className="flex gap-3 rounded-card border border-line bg-surface p-4">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Регион</dt>
                    <dd className="mt-0.5 text-sm font-medium">{detail.region}</dd>
                  </div>
                </div>
              ) : null}
              {detail.meetingPoint ? (
                <div className="flex gap-3 rounded-card border border-line bg-surface p-4">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Место встречи</dt>
                    <dd className="mt-0.5 text-sm font-medium">{detail.meetingPoint}</dd>
                  </div>
                </div>
              ) : null}
            </dl>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Гид</h2>
            <Card className="rounded-card border border-line bg-surface shadow-sm">
              <CardContent className="flex flex-col gap-1 p-5">
                <p className="text-sm text-muted-foreground">Экскурсию проводит</p>
                <Link
                  href={`/guides/${detail.guide.slug}`}
                  className="w-fit text-lg font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {detail.guide.displayName}
                </Link>
                <Link
                  href={`/guides/${detail.guide.slug}`}
                  className="mt-1 w-fit text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Профиль гида
                </Link>
              </CardContent>
            </Card>
          </section>
        </div>

        <aside className="w-full lg:sticky lg:top-24 lg:self-start">
          <Card className="rounded-card border border-line bg-surface shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5">
              <div>
                <p className="text-3xl font-semibold">{priceLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Отправьте запрос — гид подтвердит детали и дату.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href={requestHref}>Отправить запрос гиду</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

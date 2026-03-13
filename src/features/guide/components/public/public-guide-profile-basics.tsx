import type { ReactNode } from "react";

import { Globe2, MapPinned, Shield, Sparkles } from "lucide-react";

import { FavoriteToggle } from "@/components/shared/favorite-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicGuideProfile } from "@/data/public-guides/types";

function initials(name: string) {
  return name
    .split(/\s+/g)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function PublicGuideProfileBasics({ guide }: { guide: PublicGuideProfile }) {
  const trustCount = Object.values(guide.trustMarkers).filter(Boolean).length;
  const trustTotal = Object.keys(guide.trustMarkers).length;

  return (
    <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
      <Card className="glass-panel overflow-hidden rounded-[2.2rem] border border-white/70">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-18 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-accent text-2xl font-semibold text-white shadow-[0_18px_40px_rgba(33,89,120,0.24)]">
                {initials(guide.displayName)}
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Профиль гида
                  </p>
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                    {guide.displayName}
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                    {guide.headline}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full px-3">
                    <MapPinned className="mr-1 size-3.5" />
                    {guide.homeBase}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3">
                    <Sparkles className="mr-1 size-3.5" />
                    {guide.yearsExperience}+ лет опыта
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3">
                    <Shield className="mr-1 size-3.5" />
                    Доверие {trustCount}/{trustTotal}
                  </Badge>
                </div>
              </div>
            </div>

            <FavoriteToggle
              targetType="guide"
              slug={guide.slug}
              label={`Сохранить гида ${guide.displayName}`}
            />
          </div>

          <div className="rounded-[1.8rem] border border-border/70 bg-white/72 p-5">
            <p className="text-sm leading-8 text-muted-foreground">{guide.bio}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="section-frame rounded-[2.2rem]">
        <CardContent className="grid gap-4 p-6 sm:p-8">
          <InfoBlock title="Регионы">
            <div className="flex flex-wrap gap-2">
              {guide.regions.map((item) => (
                <Badge key={item} variant="secondary" className="rounded-full px-3">
                  {item}
                </Badge>
              ))}
            </div>
          </InfoBlock>

          <InfoBlock title="Языки">
            <div className="flex flex-wrap gap-2">
              {guide.languages.map((item) => (
                <Badge key={item} variant="outline" className="rounded-full px-3">
                  <Globe2 className="mr-1 size-3.5" />
                  {item}
                </Badge>
              ))}
            </div>
          </InfoBlock>

          <InfoBlock title="Средняя оценка">
            <div className="space-y-1">
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {guide.reviewsSummary.averageRating.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">
                на основе {guide.reviewsSummary.totalReviews} отзывов
              </p>
            </div>
          </InfoBlock>
        </CardContent>
      </Card>
    </section>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-white/72 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

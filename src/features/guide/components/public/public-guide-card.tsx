import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PublicGuideCardGuide = {
  id: string;
  slug: string;
  name: string;
  avatarUrl: string;
  rating: number;
  tourCount: number;
  specialties: string[];
  cities: string[];
};

function toursWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "экскурсий";
  if (mod10 === 1) return "экскурсия";
  if (mod10 >= 2 && mod10 <= 4) return "экскурсии";
  return "экскурсий";
}

export function PublicGuideCard({
  guide,
  className,
}: {
  guide: PublicGuideCardGuide;
  className?: string;
}) {
  const hasRating = guide.rating > 0;
  const hasTours = guide.tourCount > 0;
  const ratingLabel = hasRating ? guide.rating.toFixed(1) : "";

  return (
    <GlassCard
      asChild
      className={cn(
        "flex gap-4 p-4 transition-all duration-300",
        "items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg",
        className,
      )}
    >
      <Link href={`/guides/${guide.slug}`}>
        <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-border/40 bg-muted">
          <Image
            src={guide.avatarUrl}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
  
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-base font-semibold text-foreground">
              {guide.name}
            </span>
            {hasRating ? (
              <span className="inline-flex items-center gap-1 text-sm text-amber-500" aria-label={`Рейтинг ${ratingLabel}`}>
                <Star className="size-3.5 fill-amber-400 text-amber-400" /> {ratingLabel}
              </span>
            ) : null}
            {hasTours ? (
              <span className="text-xs text-muted-foreground">
                {guide.tourCount} {toursWord(guide.tourCount)}
              </span>
            ) : null}
          </div>
  
          {guide.specialties.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {guide.specialties.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-normal normal-case"
                >
                  {s}
                </Badge>
              ))}
            </div>
          ) : null}
  
          {guide.cities.length > 0 ? (
            <p className="text-xs text-muted-foreground">{guide.cities.join(" · ")}</p>
          ) : null}
        </div>
      </Link>
    </GlassCard>
  );
}

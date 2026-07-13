import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn, pluralize } from "@/lib/utils";

export type PublicGuideCardProps = {
  slug: string;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  verified?: boolean;
  experienceYears?: number | null;
  specialties?: string[];
  tripsCompleted?: number | null;
  recommendPct?: number | null;
  languages?: string[];
  className?: string;
};

function Dot() {
  return <span className="size-[3px] rounded-full bg-on-surface-muted/60" />;
}

function buildRoleLine(languages: string[], experienceYears?: number | null): string {
  const parts: string[] = [];
  if (languages.length > 0) parts.push(languages.join(", "));
  if (experienceYears != null && experienceYears > 0) {
    parts.push(`${experienceYears} ${pluralize(experienceYears, "год", "года", "лет")} в туризме`);
  }
  return parts.join(" · ");
}

/** Non-selectable guide directory card — links to /guides/{slug}. Portrait, faces and names the guide. */
export function PublicGuideCard({
  slug,
  fullName,
  initials,
  avatarUrl,
  rating,
  reviewCount,
  verified = false,
  experienceYears,
  specialties = [],
  tripsCompleted,
  recommendPct,
  languages = [],
  className,
}: PublicGuideCardProps) {
  const roleLine = buildRoleLine(languages, experienceYears);
  const visibleSpecialties = specialties.slice(0, 3);
  const showRating = rating != null && rating > 0;
  const showReviews = reviewCount != null && reviewCount > 0;
  const showTrips = tripsCompleted != null && tripsCompleted > 0;
  const showRecommend = recommendPct != null && recommendPct > 0;

  return (
    <Link
      href={`/guides/${slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface-lowest p-0 transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={fullName}
            fill
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
            className="object-cover object-[center_25%]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-surface-low">
            <span className="flex size-16 items-center justify-center rounded-full bg-background text-xl font-semibold text-on-surface-muted">
              {initials}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 py-4">
        <div className="mb-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-lg font-bold tracking-[-0.02em] text-on-surface">{fullName}</span>
          {verified ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-text">
              <BadgeCheck className="size-3.5" strokeWidth={2.3} />
              Проверен
            </span>
          ) : null}
        </div>

        {roleLine ? <div className="mb-3 text-sm text-on-surface-muted">{roleLine}</div> : null}

        {visibleSpecialties.length > 0 ? (
          <div className="mb-3.5 flex flex-wrap gap-2">
            {visibleSpecialties.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-low px-3 py-1 text-xs font-medium text-ink-2"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 text-sm text-on-surface-muted">
          {showReviews ? (
            <>
              {showRating ? (
                <span className="inline-flex items-center gap-[5px] font-semibold text-on-surface">
                  <Star className="size-4 fill-gold text-gold" />
                  {rating!.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              ) : null}
              {showRating ? <Dot /> : null}
              <span>
                {reviewCount} {pluralize(reviewCount!, "отзыв", "отзыва", "отзывов")}
              </span>
            </>
          ) : (
            <Badge variant="secondary">Пока без отзывов</Badge>
          )}
          {showTrips ? (
            <>
              <Dot />
              <span>
                {tripsCompleted} {pluralize(tripsCompleted!, "поездка", "поездки", "поездок")}
              </span>
            </>
          ) : null}
          {showRecommend ? (
            <>
              <Dot />
              <span>{recommendPct}% рекомендуют</span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

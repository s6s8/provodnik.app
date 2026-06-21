"use client";

import type { ReactNode } from "react";
import { BadgeCheck, Check, MapPin, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type GuideCardInfo = {
  full_name: string | null;
  avatar_url: string | null;
  rating: number | null;
  review_count: number | null;
  verified: boolean;
  years_experience: number | null;
  trips_completed: number | null;
  recommend_pct: number | null;
  languages: string[];
  specialties: string[];
};

type GuideOfferCardProps = {
  guide: GuideCardInfo;
  name: string;
  quote?: string | null;
  perPersonPriceLabel: string;
  selected?: boolean;
  /** Whether to show the "Местный житель" badge (caller decides from real data). */
  isLocal?: boolean;
  onSelect?: () => void;
  /** Full-width slot below the card head: deviation chips, route, inclusions, actions. */
  children?: ReactNode;
  className?: string;
};

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function buildRoleLine(guide: GuideCardInfo): string {
  const parts: string[] = [];
  if (guide.languages.length > 0) parts.push(guide.languages.join(", "));
  if (guide.years_experience && guide.years_experience > 0) {
    const word = pluralRu(guide.years_experience, "год", "года", "лет");
    parts.push(`${guide.years_experience} ${word} в туризме`);
  }
  return parts.join(" · ");
}

function Dot() {
  return <span className="size-[3px] rounded-full bg-on-surface-muted/60" />;
}

/**
 * Elevated, selectable guide card for the request-detail comparison. Renders only
 * the data that exists (graceful omission); no fabricated social proof. The card
 * head is clickable to select; the `children` slot stops propagation for actions.
 */
export function GuideOfferCard({
  guide,
  name,
  quote,
  perPersonPriceLabel,
  selected = false,
  isLocal = false,
  onSelect,
  children,
  className,
}: GuideOfferCardProps) {
  const roleLine = buildRoleLine(guide);
  const showRating = guide.rating != null && guide.rating > 0;
  const showReviews = guide.review_count != null && guide.review_count > 0;
  const showTrips = guide.trips_completed != null && guide.trips_completed > 0;
  const showRecommend = guide.recommend_pct != null && guide.recommend_pct > 0;
  const verifiedWord = "Проверен";

  return (
    <article
      onClick={onSelect}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onSelect) {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      className={cn(
        "group relative cursor-pointer rounded-[16px] border border-border bg-card p-[22px] shadow-card transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-[0_20px_38px_-22px_rgba(20,28,40,.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {selected ? (
        <div className="pointer-events-none absolute inset-0 rounded-[16px] border-2 border-primary shadow-[0_0_0_4px_rgba(26,86,164,.09)]" />
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[128px_minmax(0,1fr)] md:grid-cols-[128px_minmax(0,1fr)_200px]">
        {/* Portrait */}
        <div className="relative">
          <Avatar className="h-[140px] w-full rounded-[12px] sm:h-full sm:min-h-[178px]">
            {guide.avatar_url ? (
              <AvatarImage src={guide.avatar_url} alt={name} className="object-cover" />
            ) : null}
            <AvatarFallback className="rounded-[12px] bg-surface-low text-2xl font-semibold text-on-surface-muted">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isLocal ? (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-[5px] rounded-full bg-[rgba(8,14,24,.62)] px-[9px] py-1 text-[11px] font-semibold text-white backdrop-blur-[4px]">
              <MapPin className="size-3" strokeWidth={1.8} />
              Местный житель
            </span>
          ) : null}
        </div>

        {/* Body */}
        <div className="flex min-w-0 flex-col">
          <div className="mb-1 flex flex-wrap items-center gap-x-[10px] gap-y-1">
            <span className="text-[21px] font-bold leading-[1.15] tracking-[-0.02em] text-on-surface">
              {name}
            </span>
            {guide.verified ? (
              <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-success">
                <BadgeCheck className="size-[14px]" strokeWidth={2.3} />
                {verifiedWord}
              </span>
            ) : null}
            {selected ? (
              <span className="inline-flex h-[22px] items-center rounded-full bg-primary/10 px-[10px] text-[11.5px] font-semibold text-primary">
                Ваш выбор
              </span>
            ) : null}
          </div>
          {roleLine ? (
            <div className="mb-3 text-[13.5px] text-on-surface-muted">{roleLine}</div>
          ) : null}
          {quote ? (
            <p className="mb-[13px] max-w-[58ch] text-[15px] leading-[1.55] text-ink-2">{quote}</p>
          ) : null}
          {guide.specialties.length > 0 ? (
            <div className="mb-[14px] flex flex-wrap gap-[7px]">
              {guide.specialties.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[rgba(20,28,40,.05)] px-3 py-[5px] text-[12.5px] font-medium text-ink-2"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {showRating || showReviews || showTrips || showRecommend ? (
            <div className="mt-auto flex flex-wrap items-center gap-[9px] text-[13.5px] text-on-surface-muted">
              {showRating ? (
                <span className="inline-flex items-center gap-[5px] font-semibold text-on-surface">
                  <Star className="size-[15px] fill-[var(--gold)] text-[var(--gold)]" />
                  {guide.rating!.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              ) : null}
              {showReviews ? (
                <>
                  {showRating ? <Dot /> : null}
                  <span>
                    {guide.review_count} {pluralRu(guide.review_count!, "отзыв", "отзыва", "отзывов")}
                  </span>
                </>
              ) : null}
              {showTrips ? (
                <>
                  {showRating || showReviews ? <Dot /> : null}
                  <span>
                    {guide.trips_completed} {pluralRu(guide.trips_completed!, "поездка", "поездки", "поездок")}
                  </span>
                </>
              ) : null}
              {showRecommend ? (
                <>
                  {showRating || showReviews || showTrips ? <Dot /> : null}
                  <span>{guide.recommend_pct}% рекомендуют</span>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Action */}
        <div className="flex flex-col justify-center border-t border-border pt-5 text-center md:border-l md:border-t-0 md:pl-[22px] md:pt-0">
          <div className="text-[23px] font-bold leading-none tracking-[-0.02em] text-on-surface">
            {perPersonPriceLabel}
          </div>
          <div className="mb-4 mt-[3px] text-[12.5px] text-on-surface-muted">с человека</div>
          <button
            type="button"
            className={cn(
              "inline-flex h-[46px] w-full items-center justify-center gap-[7px] rounded-[10px] text-[14.5px] font-semibold transition-colors",
              selected
                ? "border border-success/30 bg-success/12 text-success"
                : "bg-primary text-white hover:bg-primary-hover",
            )}
          >
            {selected ? (
              <>
                <Check className="size-[15px]" strokeWidth={2.6} />
                Выбран
              </>
            ) : (
              "Выбрать гида"
            )}
          </button>
        </div>
      </div>

      {children ? (
        <div
          className="mt-5 border-t border-border pt-5"
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          {children}
        </div>
      ) : null}
    </article>
  );
}

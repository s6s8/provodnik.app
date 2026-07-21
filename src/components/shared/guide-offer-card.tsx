"use client";

import type { ReactNode } from "react";
import { BadgeCheck, Check, MapPin, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, pluralize } from "@/lib/utils";

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
  selected?: boolean;
  /** Whether to show the "Местный житель" badge (caller decides from real data). */
  isLocal?: boolean;
  /** Short SLA line, e.g. «Отвечает в течение часа» (caller-provided from real data). */
  responseTimeLabel?: string;
  /** Link to the guide's public profile → renders «Профиль →». */
  profileHref?: string;
  /** Guide with too little history for social proof → note + suppressed stats row. */
  isNewGuide?: boolean;
  /** Specialties that match the request — rendered bold with a check. */
  matchingSpecialties?: string[];
  onSelect?: () => void;
  /** Optional dismissal — renders a «Не подходит» ghost action when passed. */
  onReject?: () => void;
  /** Full-width slot below the card head: deviation chips, route, inclusions, actions. */
  children?: ReactNode;
  className?: string;
};

// ponytail: D21-7 — the guide-selected language is profile data, not offer-card
// identity; the role line carries experience only. Language stays on the guide
// profile screen, which does not use this presentation.
function buildRoleLine(guide: GuideCardInfo): string {
  if (!guide.years_experience || guide.years_experience <= 0) return "";
  const word = pluralize(guide.years_experience, "год", "года", "лет");
  return `${guide.years_experience} ${word} в туризме`;
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
  selected = false,
  isLocal = false,
  responseTimeLabel,
  profileHref,
  isNewGuide = false,
  matchingSpecialties,
  onSelect,
  onReject,
  children,
  className,
}: GuideOfferCardProps) {
  const roleLine = buildRoleLine(guide);
  const showRating = guide.rating != null && guide.rating > 0;
  const showReviews = guide.review_count != null && guide.review_count > 0;
  const showTrips = guide.trips_completed != null && guide.trips_completed > 0;
  const showRecommend =
    guide.recommend_pct != null &&
    guide.recommend_pct > 0 &&
    guide.review_count != null &&
    guide.review_count >= 3;
  const showStats = !isNewGuide && (showRating || showReviews || showTrips || showRecommend);
  const matchSet = new Set(matchingSpecialties ?? []);
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
        "group relative cursor-pointer rounded-card border border-border p-[22px] shadow-card transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-[0_20px_38px_-22px_rgba(20,28,40,.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "bg-gradient-to-b from-surface to-primary-tint/30" : "bg-card",
        className,
      )}
    >
      {selected ? (
        <div className="pointer-events-none absolute inset-0 rounded-card border-2 border-primary shadow-[0_0_0_4px_rgba(26,86,164,.09)]" />
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[128px_minmax(0,1fr)]">
        {/* Portrait */}
        <div className="relative">
          <Avatar className="h-[140px] w-full rounded-step sm:h-full sm:min-h-[178px]">
            {guide.avatar_url ? (
              <AvatarImage src={guide.avatar_url} alt={name} className="object-cover" />
            ) : null}
            <AvatarFallback className="rounded-step bg-surface-low text-2xl font-semibold text-on-surface-muted">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isLocal ? (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-[5px] rounded-full bg-[rgba(8,14,24,.62)] px-[9px] py-1 text-xs font-semibold text-white backdrop-blur-[4px]">
              <MapPin className="size-3" strokeWidth={1.8} />
              Местный житель
            </span>
          ) : null}
        </div>

        {/* Body */}
        <div className="flex min-w-0 flex-col">
          <div className="mb-1 flex flex-wrap items-center gap-x-[10px] gap-y-1">
            <span className="text-xl font-bold leading-[1.15] tracking-[-0.02em] text-on-surface">
              {name}
            </span>
            {guide.verified ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                <BadgeCheck className="size-[14px]" strokeWidth={2.3} />
                {verifiedWord}
              </span>
            ) : null}
            {selected ? (
              <span className="inline-flex h-[22px] items-center rounded-full bg-primary/10 px-[10px] text-xs font-semibold text-primary">
                Ваш выбор
              </span>
            ) : null}
          </div>
          {roleLine ? (
            <div className="mb-1 text-sm text-on-surface-muted">{roleLine}</div>
          ) : null}
          <div className="mb-3 flex flex-wrap items-center gap-x-[10px] gap-y-1 text-xs text-on-surface-muted">
            {responseTimeLabel ? <span>{responseTimeLabel}</span> : null}
            {profileHref ? (
              <a
                href={profileHref}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-primary hover:underline"
              >
                Профиль →
              </a>
            ) : null}
          </div>
          {quote ? (
            <p className="mb-[13px] max-w-[58ch] text-sm leading-[1.55] text-ink-2">{quote}</p>
          ) : null}
          {guide.specialties.length > 0 ? (
            <div className="mb-[14px] flex flex-wrap gap-[7px]">
              {guide.specialties.map((tag) => {
                const matched = matchSet.has(tag);
                return (
                  <span
                    key={tag}
                    className={cn(
                      "inline-flex items-center gap-[5px] rounded-full px-3 py-[5px] text-xs font-medium",
                      matched ? "bg-primary-tint text-primary" : "bg-surface-low text-ink-2",
                    )}
                  >
                    {matched ? <Check className="size-[13px]" strokeWidth={2.6} /> : null}
                    <span className={matched ? "font-bold" : undefined}>{tag}</span>
                  </span>
                );
              })}
            </div>
          ) : null}
          {isNewGuide ? (
            <div className="mt-auto text-sm font-medium text-on-surface-muted">
              Новый гид — первые поездки
            </div>
          ) : null}
          {showStats ? (
            <div className="mt-auto flex flex-wrap items-center gap-[9px] text-sm text-on-surface-muted">
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
                    {guide.review_count} {pluralize(guide.review_count!, "отзыв", "отзыва", "отзывов")}
                  </span>
                </>
              ) : null}
              {showTrips ? (
                <>
                  {showRating || showReviews ? <Dot /> : null}
                  <span>
                    {guide.trips_completed} {pluralize(guide.trips_completed!, "поездка", "поездки", "поездок")}
                  </span>
                </>
              ) : null}
              {showRecommend ? (
                <>
                  {showRating || showReviews || showTrips ? <Dot /> : null}
                  <span>
                    {guide.recommend_pct}% рекомендуют (из {guide.review_count} отзывов)
                  </span>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

      </div>

      {/* Action footer — centered full-width CTA under the card head (#57) */}
      <div className="mt-5 flex flex-col items-center gap-3 border-t border-border pt-5 text-center">
        <button
          type="button"
          className={cn(
            "inline-flex h-[46px] w-full max-w-sm items-center justify-center gap-[7px] rounded-btn text-sm font-semibold transition-colors",
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
        {onSelect ? (
          <div className="text-xs text-muted-foreground">
            после выбора откроются контакты и чат
          </div>
        ) : null}
        {onReject ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
            className="inline-flex h-9 w-full max-w-sm items-center justify-center rounded-btn text-sm font-medium text-on-surface-muted transition-colors hover:bg-surface-low"
          >
            Не подходит
          </button>
        ) : null}
      </div>

      {children ? (
        <div
          className="mt-5 border-t border-border pt-5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          {children}
        </div>
      ) : null}
    </article>
  );
}

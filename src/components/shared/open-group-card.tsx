import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  Users,
} from "lucide-react";

import { THEMES, type ThemeSlug } from "@/data/themes";

const THEME_BY_SLUG = new Map(THEMES.map((t) => [t.slug, t] as const));

export interface OpenGroupCardProps {
  href: string;
  city: string;
  region?: string;
  imageUrl: string;
  /** "selected" = a guide is chosen (booked); "waiting" = still open. */
  status: "selected" | "waiting";
  /** e.g. "от 6 чел." */
  minPeople?: string;
  date?: string;
  datesFlexible?: boolean;
  /** e.g. "10:00–18:00" */
  time?: string;
  /** theme slugs — resolved to icon + label */
  interests?: string[];
  avatarUrl?: string | null;
  avatarInitials?: string;
  /** shown next to the avatar when present (e.g. a chosen guide's name) */
  personName?: string;
  /** shown after the name when present */
  personRating?: number | string;
  /** shown instead of a name (e.g. "4 отклика") */
  footerText?: string;
  joinHref?: string;
  joinLabel?: string;
  priority?: boolean;
}

/**
 * Open-group card (homepage "Открытые группы" + /requests marketplace).
 * Photo + region pill, city title with a status badge (Гид выбран / Ждёт гида),
 * Сборная-группа pill, date/flex/time, interest tags, an organizer/guide row,
 * and a "Присоединиться" CTA. Intentionally has NO per-person price and NO
 * seats progress bar (mockup spec).
 */
export function OpenGroupCard({
  href,
  city,
  region,
  imageUrl,
  status,
  minPeople,
  date,
  datesFlexible,
  time,
  interests,
  avatarUrl,
  avatarInitials = "П",
  personName,
  personRating,
  footerText,
  joinHref,
  joinLabel = "Присоединиться",
  priority,
}: OpenGroupCardProps) {
  const themes = (interests ?? [])
    .map((slug) => THEME_BY_SLUG.get(slug as ThemeSlug))
    .filter((t): t is (typeof THEMES)[number] => Boolean(t))
    .slice(0, 3);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative h-[148px] bg-surface-low">
        <Image
          src={imageUrl}
          alt={city}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[rgba(8,14,24,0.28)] via-transparent to-[rgba(8,14,24,0.4)]"
          aria-hidden="true"
        />
        {region ? (
          <span className="absolute left-2.5 top-2.5 inline-flex h-[25px] items-center gap-1.5 rounded-full bg-[rgba(8,14,24,0.55)] px-2.5 text-[11px] font-semibold text-white">
            <MapPin className="h-[11px] w-[11px]" aria-hidden="true" />
            {region}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[18px] font-bold leading-tight tracking-[-0.02em] text-foreground">
            {city}
          </div>
          {status === "selected" ? (
            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-bold text-[#2F8F66]">
              <CheckCircle2 className="h-[14px] w-[14px]" aria-hidden="true" />
              Гид выбран
            </span>
          ) : (
            <span className="inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[rgba(212,135,43,0.14)] px-2.5 text-[11.5px] font-bold text-[#9A5712]">
              <Clock className="h-3 w-3" aria-hidden="true" />
              Ждёт гида
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#EAF1FA] px-2.5 text-[11.5px] font-semibold text-primary">
            <Users className="h-3 w-3" aria-hidden="true" />
            Сборная группа
          </span>
          {minPeople ? (
            <span className="text-xs font-semibold text-muted-foreground">· {minPeople}</span>
          ) : null}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12.5px] font-medium text-ink-2">
          {date ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-[13px] w-[13px] text-muted-foreground" aria-hidden="true" />
              {date}
            </span>
          ) : null}
          {datesFlexible ? (
            <span className="inline-flex h-[22px] items-center rounded-full bg-[rgba(47,143,102,0.12)] px-2 text-[11px] font-bold text-[#1F7A52]">
              Гибкие даты
            </span>
          ) : null}
          {time ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-[13px] w-[13px] text-muted-foreground" aria-hidden="true" />
              {time}
            </span>
          ) : null}
        </div>

        {themes.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {themes.map((theme) => {
              const Icon = theme.Icon;
              return (
                <span
                  key={theme.slug}
                  className="inline-flex h-[26px] items-center gap-1.5 rounded-full border border-border px-2.5 text-xs font-semibold text-ink-2"
                >
                  <Icon className="h-[13px] w-[13px] text-muted-foreground" aria-hidden="true" />
                  {theme.label}
                </span>
              );
            })}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2.5 pt-3.5">
          <div className="flex items-center gap-2">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={personName ?? "Организатор"}
                width={30}
                height={30}
                className="h-[30px] w-[30px] rounded-full object-cover"
              />
            ) : (
              <span className="grid h-[30px] w-[30px] place-items-center rounded-full border border-border bg-surface-low text-xs font-bold text-muted-foreground">
                {avatarInitials}
              </span>
            )}
            {personName ? (
              <div className="leading-tight">
                <div className="text-[12.5px] font-bold text-foreground">{personName}</div>
                {personRating != null ? (
                  <div className="flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground">
                    <Star className="h-3 w-3 fill-[#D4872B] text-[#D4872B]" aria-hidden="true" />
                    {personRating}
                  </div>
                ) : null}
              </div>
            ) : footerText ? (
              <span className="text-xs font-semibold text-muted-foreground">{footerText}</span>
            ) : null}
          </div>
        </div>

        <Link
          href={joinHref ?? href}
          className="mt-3 inline-flex h-[42px] w-full items-center justify-center rounded-[11px] bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {joinLabel}
        </Link>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Calendar, CheckCircle2, Clock, MapPin, Users } from "lucide-react";

import { AvatarStack, type AvatarStackMember } from "@/components/shared/avatar-stack";
import { THEMES, type ThemeSlug } from "@/data/themes";

const THEME_BY_SLUG = new Map(THEMES.map((t) => [t.slug, t] as const));

function pluralOffers(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} откликов`;
  if (mod10 === 1) return `${n} отклик`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} отклика`;
  return `${n} откликов`;
}

export interface OpenGroupCardProps {
  href: string;
  city: string;
  region?: string;
  imageUrl: string;
  /** "selected" = a guide is chosen (booked); "waiting" = still open. */
  status: "selected" | "waiting";
  /** open offers count — drives the "N откликов" badge when waiting. */
  offerCount?: number;
  /** e.g. "от 6 чел." */
  minPeople?: string;
  date?: string;
  datesFlexible?: boolean;
  /** e.g. "10:00–18:00" */
  time?: string;
  /** theme slugs — resolved to icon + label */
  interests?: string[];
  /** traveller avatars (overlap stack + "+N") */
  members?: readonly AvatarStackMember[];
  /** total participant count (for the "+N" overflow) */
  participantCount?: number;
  /** e.g. "Опубликован: 30 июня" */
  publishedAt?: string;
  /** per-person budget, e.g. "3 000 ₽ / чел" */
  price?: string;
  /** unread offers → left accent border */
  unread?: boolean;
  joinHref?: string;
  joinLabel?: string;
  priority?: boolean;
}

/**
 * Open-group card (homepage "Открытые группы" + /requests marketplace).
 * Photo + region pill, status badge (Гид выбран / N откликов / Ждёт гида),
 * Сборная-группа pill, date/flex/time, interest tags, traveller avatar stack +
 * publish date, the group total budget, and a "Присоединиться" CTA. No
 * per-person price (intentionally).
 */
export function OpenGroupCard({
  href,
  city,
  region,
  imageUrl,
  status,
  offerCount = 0,
  minPeople,
  date,
  datesFlexible,
  time,
  interests,
  members,
  participantCount,
  publishedAt,
  price,
  unread,
  joinHref,
  joinLabel = "Присоединиться",
  priority,
}: OpenGroupCardProps) {
  const themes = (interests ?? [])
    .map((slug) => THEME_BY_SLUG.get(slug as ThemeSlug))
    .filter((t): t is (typeof THEMES)[number] => Boolean(t))
    .slice(0, 3);
  const memberList = members ?? [];

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm${
        unread ? " border-l-4 border-l-primary" : ""
      }`}
    >
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
            <span className="inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap text-xs font-bold text-[#2F8F66]">
              <CheckCircle2 className="h-[14px] w-[14px]" aria-hidden="true" />
              Гид выбран
            </span>
          ) : offerCount > 0 ? (
            <span className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full bg-primary/10 px-2.5 text-[11.5px] font-bold text-primary">
              {pluralOffers(offerCount)}
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
          <div className="flex min-w-0 flex-col gap-1">
            {memberList.length > 0 ? (
              <AvatarStack members={memberList} size={26} overlap={9} totalCount={participantCount} />
            ) : (
              <span className="grid h-[30px] w-[30px] place-items-center rounded-full border border-border bg-surface-low text-xs font-bold text-muted-foreground">
                П
              </span>
            )}
            {publishedAt ? (
              <span className="truncate text-[11px] font-medium text-muted-foreground">{publishedAt}</span>
            ) : null}
          </div>
          {price ? (
            <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-foreground">{price}</span>
          ) : null}
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

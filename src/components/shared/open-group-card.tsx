import Image from "next/image";
import Link from "next/link";
import { Calendar, CheckCircle2, Clock, MapPin, Users } from "lucide-react";

import { AvatarStack, type AvatarStackMember } from "@/components/shared/avatar-stack";
import { InterestTag } from "@/components/shared/interest-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scrim } from "@/components/ui/scrim";
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
  /** Viewer created this request — replace the join CTA with "Это ваша группа". */
  owner?: boolean;
  priority?: boolean;
}

/**
 * Open-group card (homepage "Открытые группы" + /requests marketplace).
 * Photo + region badge, status badge (Гид выбран / N откликов / Ждёт гида),
 * Сборная-группа badge, date/flex/time, interest tags, traveller avatar stack +
 * publish date, the group total budget, and a "Присоединиться" CTA.
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
  owner,
  priority,
}: OpenGroupCardProps) {
  const themes = (interests ?? [])
    .map((slug) => THEME_BY_SLUG.get(slug as ThemeSlug))
    .filter((t): t is (typeof THEMES)[number] => Boolean(t))
    .slice(0, 3);
  const memberList = members ?? [];

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-card border border-border bg-card shadow-card${
        unread ? " border-l-4 border-l-primary" : ""
      }`}
    >
      <div className="relative h-36 bg-surface-low">
        <Image
          src={imageUrl}
          alt={city}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
        <Scrim />
        {region ? (
          <Badge variant="overlay" className="absolute left-2.5 top-2.5 gap-1">
            <MapPin aria-hidden="true" />
            {region}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="text-lg font-bold leading-tight tracking-tight text-foreground">
            {city}
          </div>
          {status === "selected" ? (
            <Badge variant="success" className="shrink-0 gap-1">
              <CheckCircle2 aria-hidden="true" />
              Гид выбран
            </Badge>
          ) : offerCount > 0 ? (
            <Badge variant="info" className="shrink-0">
              {pluralOffers(offerCount)}
            </Badge>
          ) : (
            <Badge variant="warning" className="shrink-0 gap-1">
              <Clock aria-hidden="true" />
              Ждёт гида
            </Badge>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <Badge variant="info" className="gap-1">
            <Users aria-hidden="true" />
            Сборная группа
          </Badge>
          {minPeople ? (
            <span className="text-xs font-semibold text-muted-foreground">· {minPeople}</span>
          ) : null}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-medium text-ink-2">
          {date ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {date}
            </span>
          ) : null}
          {datesFlexible ? <Badge variant="success">Гибкие даты</Badge> : null}
          {time ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {time}
            </span>
          ) : null}
        </div>

        {themes.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {themes.map((theme) => (
              <InterestTag key={theme.slug} icon={theme.Icon}>
                {theme.label}
              </InterestTag>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2.5 pt-3.5">
          <div className="flex min-w-0 flex-col gap-1">
            {memberList.length > 0 ? (
              <AvatarStack members={memberList} size={26} overlap={9} totalCount={participantCount} />
            ) : (
              <span className="grid size-8 place-items-center rounded-full border border-border bg-surface-low text-xs font-bold text-muted-foreground">
                П
              </span>
            )}
            {publishedAt ? (
              <span className="truncate text-xs font-medium text-muted-foreground">{publishedAt}</span>
            ) : null}
          </div>
          {price ? (
            <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-foreground">{price}</span>
          ) : null}
        </div>

        {owner ? (
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link href={href}>Это ваша группа</Link>
          </Button>
        ) : (
          <Button asChild className="mt-3 w-full">
            <Link href={joinHref ?? href}>{joinLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

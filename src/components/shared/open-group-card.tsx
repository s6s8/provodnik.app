import Image from "next/image";
import Link from "next/link";
import { Calendar, CheckCircle2, Clock, MapPin, Users } from "lucide-react";

import { AvatarStack, type AvatarStackMember } from "@/components/shared/avatar-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scrim } from "@/components/ui/scrim";
import { THEMES, type ThemeSlug } from "@/data/themes";
import { cn, pluralize } from "@/lib/utils";

const THEME_BY_SLUG = new Map(THEMES.map((t) => [t.slug, t] as const));

function pluralOffers(n: number): string {
  return `${n} ${pluralize(n, "отклик", "отклика", "откликов")}`;
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
  /** When true, time is open (paired with flexible dates). */
  timeFlexible?: boolean;
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
  /** Viewer already joined this open group — replace the join CTA with "Вы в группе". */
  member?: boolean;
  priority?: boolean;
}

/**
 * Open-group card (homepage "Открытые группы" + /requests marketplace).
 * Photo + region badge, status badge (Гид выбран / N откликов / Ждёт гида),
 * Сборная-группа badge, date/time, a plain meta line (flexible dates +
 * interests), traveller avatar stack + publish date, the group total budget,
 * and a "Присоединиться" CTA. Photo and title link to the card target.
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
  timeFlexible,
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
  member,
  priority,
}: OpenGroupCardProps) {
  const themeLabels = (interests ?? [])
    .map((slug) => THEME_BY_SLUG.get(slug as ThemeSlug))
    .filter((t): t is (typeof THEMES)[number] => Boolean(t))
    .slice(0, 3)
    .map((t) => t.label);
  // Interests + date flexibility read as plain meta, not pills — only status and
  // format stay as badges (no pill soup).
  const meta = [
    datesFlexible ? "Гибкие даты" : null,
    timeFlexible ? "Гибкое время" : null,
    ...themeLabels,
  ].filter(Boolean);
  const memberList = members ?? [];
  const statusBadge =
    status === "selected"
      ? { variant: "success" as const, Icon: CheckCircle2, label: "Гид выбран" }
      : offerCount > 0
        ? { variant: "info" as const, Icon: null, label: pluralOffers(offerCount) }
        : { variant: "warning" as const, Icon: Clock, label: "Ждёт гида" };
  const StatusIcon = statusBadge.Icon;
  // Real photos are http(s)/local paths; gradient fallbacks are data/SVG URLs.
  // When there's no real photo, show a designed placeholder instead of a bare
  // dark gradient that reads as "still loading" (F-08).
  const isPhoto = /^(https?:|\/)/.test(imageUrl);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-card border border-border bg-card shadow-card",
        unread && "border-l-4 border-l-primary",
      )}
    >
      <Link href={href} className="relative block h-36 bg-surface-low">
        <Image
          src={imageUrl}
          alt={city}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
        <Scrim />
        {!isPhoto ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white/90">
            <MapPin className="size-6 opacity-80" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight">{city}</span>
          </div>
        ) : null}
        {region ? (
          <Badge variant="overlay" className="absolute left-2.5 top-2.5 gap-1">
            <MapPin aria-hidden="true" />
            {region}
          </Badge>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={href}
            className="text-lg font-bold leading-tight tracking-tight text-foreground hover:underline"
          >
            {city}
          </Link>
          <Badge variant={statusBadge.variant} className="shrink-0 gap-1">
            {StatusIcon ? <StatusIcon aria-hidden="true" /> : null}
            {statusBadge.label}
          </Badge>
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
          {time && !timeFlexible ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {time}
            </span>
          ) : null}
        </div>

        {meta.length > 0 ? (
          <p className="mt-2.5 text-sm text-muted-foreground">{meta.join(" · ")}</p>
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
        ) : member ? (
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link href={href}>Вы в группе</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link href={joinHref ?? href}>{joinLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

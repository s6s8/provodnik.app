import Link from "next/link";
import { Calendar, Check, Clock, Hand, Users } from "lucide-react";

import { AvatarStack } from "@/components/shared/avatar-stack";
import { getTheme, type ThemeSlug } from "@/data/themes";

export type RequestCardFinalGroupType = "private" | "assembly";
export type RequestCardFinalGuideState = "waiting" | "offers" | "found" | "expired";

export type RequestCardFinalMember = {
  id: string;
  displayName: string;
  initials: string;
  avatarUrl?: string;
};

export type RequestCardFinalProps = {
  href: string;
  location: string;
  date: string;
  time?: string;
  groupType: RequestCardFinalGroupType;
  guideState: RequestCardFinalGuideState;
  offerCount?: number;
  datesFlexible?: boolean;
  interests?: readonly string[];
  members?: readonly RequestCardFinalMember[];
  participantCount?: number;
  price: string;
  groupPrice?: string;
  publishedAt?: string;
  unreadOfferCount?: number;
};

const datesFlexibleBadgeClassName =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700";
const exactDateBadgeClassName =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700";
const groupTypeBadgeBaseClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium";
const groupTypeBadgePrivateClassName = `${groupTypeBadgeBaseClassName} bg-purple-100 text-purple-700`;
const groupTypeBadgeAssemblyClassName = `${groupTypeBadgeBaseClassName} bg-sky-100 text-sky-700`;
const waitingGuideBadgeClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning";
const offersGuideBadgeClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700";
const foundGuideBadgeClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success";
const expiredGuideBadgeClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-ink-2";
const themeLabelChipClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-xs font-medium text-ink-2";

function getThemeData(interests: readonly string[] | undefined): { slugs: ThemeSlug[]; overflow: number } {
  const validThemes =
    interests
      ?.map((slug) => ({ slug, label: getTheme(slug)?.label }))
      .filter((theme): theme is { slug: ThemeSlug; label: string } => Boolean(theme.label))
      .sort((a, b) => a.label.length - b.label.length) ?? [];

  return {
    slugs: validThemes.slice(0, 2).map(({ slug }) => slug),
    overflow: Math.max(0, validThemes.length - 2),
  };
}

function pluralOffers(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} откликов`;
  if (mod10 === 1) return `${n} отклик`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} отклика`;
  return `${n} откликов`;
}

function GuideStatusBadge({ guideState, offerCount }: { guideState: RequestCardFinalGuideState; offerCount?: number }) {
  if (guideState === "found") {
    return (
      <span className={foundGuideBadgeClassName}>
        Гид найден <Check size={14} className="text-success" />
      </span>
    );
  }

  if (guideState === "offers") {
    return (
      <span className={offersGuideBadgeClassName}>
        {pluralOffers(offerCount ?? 0)}
      </span>
    );
  }

  if (guideState === "expired") {
    return (
      <span className={expiredGuideBadgeClassName}>
        Истёк <Clock size={14} className="text-ink-2" />
      </span>
    );
  }

  return (
    <span className={waitingGuideBadgeClassName}>
      Ждёт гида <Hand size={14} className="text-warning" />
    </span>
  );
}

function GroupTypeBadge({
  groupType,
  participantCount,
}: {
  groupType: RequestCardFinalGroupType;
  participantCount: number;
}) {
  const className = groupType === "assembly" ? groupTypeBadgeAssemblyClassName : groupTypeBadgePrivateClassName;
  const iconClassName = groupType === "assembly" ? "text-sky-700" : "text-purple-700";
  const label = groupType === "assembly" ? "Сборная группа" : "Своя группа";

  return (
    <div className="flex items-center gap-1.5">
      <span className={className}>
        <Users size={14} className={iconClassName} />
        {label}
      </span>
      <span className="text-xs font-medium text-ink-2">
        · {groupType === "assembly" ? "от " : ""}
        {participantCount} чел.
      </span>
    </div>
  );
}

function ThemeLabelChip({ slug }: { slug: ThemeSlug }) {
  const theme = getTheme(slug);

  if (!theme) {
    return null;
  }

  const { Icon, label } = theme;

  return (
    <span className={themeLabelChipClassName}>
      <Icon size={14} className="text-ink-2" aria-hidden="true" />
      {label}
    </span>
  );
}

export function RequestCardFinal({
  href,
  location,
  date,
  time,
  groupType,
  guideState,
  offerCount,
  datesFlexible = false,
  interests,
  members = [],
  participantCount,
  price,
  groupPrice,
  publishedAt,
  unreadOfferCount,
}: RequestCardFinalProps) {
  const { slugs: themeSlugs, overflow: themeOverflow } = getThemeData(interests);
  const hasUnread = (unreadOfferCount ?? 0) > 0;

  return (
    <article className={`flex h-full flex-col rounded-card bg-surface-high p-4 shadow-card transition-transform hover:-translate-y-0.5${hasUnread ? " border-l-4 border-primary" : ""}`}>
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-lg font-semibold leading-7 text-foreground">{location}</p>
          <div className="flex h-7 shrink-0 items-center">
            <GuideStatusBadge guideState={guideState} offerCount={offerCount} />
          </div>
        </div>

        <div className="mt-1.5 flex justify-start">
          <GroupTypeBadge groupType={groupType} participantCount={participantCount ?? members.length} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Calendar size={14} className="shrink-0 text-ink-2" aria-hidden="true" />
            <span className="min-w-0 truncate text-xs font-medium text-ink-2">{date}</span>
          </span>
          <span className={datesFlexible ? datesFlexibleBadgeClassName : exactDateBadgeClassName}>
            {datesFlexible ? "Гибкие даты" : "Точная дата"}
          </span>
          {time ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <Clock size={14} className="shrink-0 text-ink-2" aria-hidden="true" />
              <span className="min-w-0 truncate text-xs font-medium text-ink-2">{time}</span>
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {themeSlugs.map((slug) => (
            <ThemeLabelChip key={slug} slug={slug} />
          ))}
          {themeOverflow > 0 ? (
            <span className={themeLabelChipClassName}>+{themeOverflow}</span>
          ) : null}
        </div>
      </Link>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
        <div className="flex flex-col gap-1">
          <AvatarStack members={members} size={24} overlap={6} />
          {publishedAt ? (
            <span className="text-xs text-muted-foreground">Опубликован: {publishedAt}</span>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-foreground">{price}</span>
          {groupPrice ? <span className="shrink-0 whitespace-nowrap text-xs font-medium text-ink-2">{groupPrice}</span> : null}
        </div>
      </div>
    </article>
  );
}

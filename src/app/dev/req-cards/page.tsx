import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Check, Hand, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type ReqCardMember } from "@/components/shared/req-card";
import { getTheme, type ThemeSlug } from "@/data/themes";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type RequestCardSample = {
  scenario: string;
  href: string;
  location: string;
  date: string;
  groupType: "private" | "assembly";
  guideState: "waiting" | "found";
  datesFlexible: boolean;
  interests: ThemeSlug[];
  members: ReqCardMember[];
  price: string;
};

type RequestCardCountSample = RequestCardSample & {
  participantCount: number;
};

const countPrototypeSamples = [
  {
    scenario: "Соло · 1 участник",
    href: "/requests/count-prototype-solo",
    location: "Мцхета",
    date: "Сегодня, 18:00",
    groupType: "assembly",
    guideState: "waiting",
    datesFlexible: false,
    interests: ["history_culture", "religion"],
    members: [{ id: "ana", displayName: "Ана", initials: "А" }],
    price: "3 500 ₽",
    participantCount: 1,
  },
  {
    scenario: "Малая группа · 3 участника",
    href: "/requests/count-prototype-small",
    location: "Тбилиси",
    date: "12 июня, 18:00",
    groupType: "assembly",
    guideState: "found",
    datesFlexible: true,
    interests: ["food", "history_culture", "art"],
    members: [
      { id: "nino-count", displayName: "Нино", initials: "Н" },
      { id: "anna-count", displayName: "Анна", initials: "А" },
      { id: "maxim-count", displayName: "Максим", initials: "М" },
    ],
    price: "4 500 ₽",
    participantCount: 3,
  },
  {
    scenario: "Большая группа · 40",
    href: "/requests/count-prototype-large",
    location: "Кахетия",
    date: "5 июля, 11:30",
    groupType: "assembly",
    guideState: "waiting",
    datesFlexible: false,
    interests: ["food", "nature", "unusual"],
    members: [
      { id: "tamar-count", displayName: "Тамар", initials: "Т" },
      { id: "oleg-count", displayName: "Олег", initials: "О" },
      { id: "katya-count", displayName: "Катя", initials: "К" },
    ],
    price: "6 800 ₽",
    participantCount: 40,
  },
  {
    scenario: "Своя группа · 2 участника",
    href: "/requests/count-prototype-private",
    location: "Казбеги",
    date: "21 июня, 10:00",
    groupType: "private",
    guideState: "found",
    datesFlexible: false,
    interests: ["nature", "history_culture"],
    members: [
      { id: "mariam-count", displayName: "Мариам", initials: "М" },
      { id: "roman-count", displayName: "Роман", initials: "Р" },
    ],
    price: "7 900 ₽",
    participantCount: 2,
  },
] satisfies RequestCardCountSample[];

const datesFlexibleBadgeClassName =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-primary/40 px-2 py-0.5 text-xs font-medium text-primary";
const groupTypeBadgeBaseClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium";
const groupTypeBadgeOutlineClassName = `${groupTypeBadgeBaseClassName} border border-border text-ink-2`;
const groupTypeBadgePrimaryOutlineClassName = `${groupTypeBadgeBaseClassName} border border-primary/40 text-primary`;
const waitingGuideBadgeClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning";
const foundGuideBadgeClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success";
const themeLabelChipClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-xs font-medium text-ink-2";

function getPrototypeGroupLabel(groupType: RequestCardSample["groupType"]) {
  return groupType === "private" ? "Своя группа" : "Сборная группа";
}

function GuideStatusBadge({ guideState }: { guideState: RequestCardSample["guideState"] }) {
  if (guideState === "found") {
    return (
      <span className={foundGuideBadgeClassName}>
        Гид найден <Check size={14} className="text-success" />
      </span>
    );
  }

  return (
    <span className={waitingGuideBadgeClassName}>
      Ждёт гида <Hand size={14} className="text-warning" />
    </span>
  );
}

function CountPrototypeGroupTypeBadge({ groupType }: { groupType: RequestCardSample["groupType"] }) {
  const className =
    groupType === "assembly" ? groupTypeBadgePrimaryOutlineClassName : groupTypeBadgeOutlineClassName;
  const iconClassName = groupType === "assembly" ? "text-primary" : "text-ink-2";

  return (
    <span className={className}>
      <Users size={14} className={iconClassName} /> {getPrototypeGroupLabel(groupType)}
    </span>
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

function ParticipantStack({
  members,
  participantCount,
}: {
  members: readonly ReqCardMember[];
  participantCount: number;
}) {
  const visibleMembers = members.slice(0, participantCount === 1 ? 1 : 3);
  return (
    <div className="flex shrink-0 items-center">
      {visibleMembers.map((member) => (
        <Avatar
          key={member.id}
          className="size-6 -ml-1.5 border-2 border-surface-high first:ml-0"
          title={member.displayName}
          data-testid="participant-avatar"
        >
          {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={member.displayName} /> : null}
          <AvatarFallback className="bg-surface-low text-[0.5rem] font-semibold">{member.initials}</AvatarFallback>
        </Avatar>
      ))}
      {participantCount > 1 ? (
        <span
          className="relative z-10 flex size-6 -ml-1.5 items-center justify-center rounded-full border-2 border-surface-high bg-ink-2 text-[0.625rem] font-semibold text-surface-high"
          data-testid="participant-count-badge"
        >
          {participantCount}
        </span>
      ) : null}
    </div>
  );
}

function RequestCardThemesTopPrototype({
  href,
  location,
  date,
  groupType,
  guideState,
  datesFlexible,
  interests,
  members,
  price,
  participantCount,
}: RequestCardCountSample) {
  const themeSlugs = interests
    .map((slug) => ({ slug, label: getTheme(slug)?.label }))
    .filter((theme): theme is { slug: ThemeSlug; label: string } => Boolean(theme.label))
    .sort((a, b) => a.label.length - b.label.length)
    .slice(0, 3)
    .map(({ slug }) => slug);

  return (
    <article className="flex h-full flex-col rounded-card bg-surface-high p-4 shadow-card transition-transform hover:-translate-y-0.5">
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-lg font-semibold leading-7 text-foreground">{location}</p>
          <div className="flex h-7 shrink-0 items-center">
            <GuideStatusBadge guideState={guideState} />
          </div>
        </div>

        <div className="mt-1.5 flex justify-start">
          <CountPrototypeGroupTypeBadge groupType={groupType} />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Calendar size={14} className="shrink-0 text-ink-2" aria-hidden="true" />
            <span className="min-w-0 truncate text-sm font-medium text-ink-2">{date}</span>
          </span>
          {datesFlexible ? <span className={datesFlexibleBadgeClassName}>Гибкие даты</span> : null}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {themeSlugs.map((slug) => (
            <ThemeLabelChip key={slug} slug={slug} />
          ))}
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <ParticipantStack members={members} participantCount={participantCount} />
        <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-foreground">{price}</span>
      </div>
    </article>
  );
}

function CountPrototypeSection({
  id,
  heading,
  description,
}: {
  id: string;
  heading: string;
  description: string;
}) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-4">
        <h2 id={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {countPrototypeSamples.map((sample) => (
          <div key={sample.href} className="flex h-full flex-col space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{sample.scenario}</p>
            <RequestCardThemesTopPrototype {...sample} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DevReqCardsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Карточки запросов — счётчик участников</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Статусы подняты в верхнюю строку, темы живут отдельными рядами, низ — только участники и цена.
        </p>
      </div>

      <div className="space-y-10">
        <CountPrototypeSection
          id="stack-badge-heading"
          heading="Счётчик в стеке"
          description="Город и статусы сверху, дата ниже, темы отдельными рядами. Внизу остаются только участники и цена."
        />
      </div>
    </main>
  );
}

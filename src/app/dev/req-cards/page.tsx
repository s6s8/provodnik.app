import Link from "next/link";
import { Check, Hand, Users } from "lucide-react";

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

type ParticipantCountVariant = "stack-badge" | "caption";

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
  "rounded-full bg-surface-low px-2 py-0.5 text-xs font-medium text-ink-2";
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
  return groupType === "private" ? "Своя группа" : "Открытая";
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
  variant,
}: {
  members: readonly ReqCardMember[];
  participantCount: number;
  variant: ParticipantCountVariant;
}) {
  const visibleMembers = members.slice(0, participantCount === 1 ? 1 : 3);
  const avatarRow = (
    <div className="flex items-center">
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
      {variant === "stack-badge" && participantCount > 1 ? (
        <span
          className="flex size-6 -ml-1.5 items-center justify-center rounded-full border-2 border-surface-high bg-surface-low text-[0.625rem] font-semibold text-ink-2"
          data-testid="participant-count-badge"
        >
          {participantCount}
        </span>
      ) : null}
    </div>
  );

  if (variant === "caption") {
    return (
      <div className="flex shrink-0 flex-col items-start gap-1">
        {avatarRow}
        {participantCount > 1 ? <span className="text-xs text-muted-foreground">{participantCount} идут</span> : null}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center">
      {avatarRow}
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
  participantVariant,
}: RequestCardCountSample & { participantVariant: ParticipantCountVariant }) {
  const themeSlugs = interests.slice(0, 3);

  return (
    <article className="relative flex h-full flex-col rounded-card bg-surface-high p-4 shadow-card transition-transform hover:-translate-y-0.5">
      <div className="absolute right-4 top-4">
        <GuideStatusBadge guideState={guideState} />
      </div>

      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <p className="truncate pr-24 text-lg font-semibold text-foreground">{location}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{date}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <CountPrototypeGroupTypeBadge groupType={groupType} />
          {datesFlexible ? <span className={datesFlexibleBadgeClassName}>Гибкие даты</span> : null}
          {themeSlugs.map((slug) => (
            <ThemeLabelChip key={slug} slug={slug} />
          ))}
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <ParticipantStack members={members} participantCount={participantCount} variant={participantVariant} />
        <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-foreground">{price}</span>
      </div>
    </article>
  );
}

function CountPrototypeSection({
  id,
  heading,
  description,
  participantVariant,
}: {
  id: string;
  heading: string;
  description: string;
  participantVariant: ParticipantCountVariant;
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
          <div key={`${participantVariant}-${sample.href}`} className="flex h-full flex-col space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{sample.scenario}</p>
            <RequestCardThemesTopPrototype {...sample} participantVariant={participantVariant} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DevReqCardsPage() {
  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Карточки запросов — счётчик участников</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Сравниваем два способа показать число участников при одинаковой верхней строке с темами-чипами и чистом
          нижнем ряду с ценой справа.
        </p>
      </div>

      <div className="space-y-10">
        <CountPrototypeSection
          id="stack-badge-heading"
          heading="1 · Счётчик в стеке"
          description="Число становится последним кружком в стеке аватаров, чтобы весь левый блок читался как один объект."
          participantVariant="stack-badge"
        />
        <CountPrototypeSection
          id="caption-heading"
          heading="2 · Счётчик подписью"
          description="Аватары остаются чистой строкой, а число участников уходит в короткую подпись под ними."
          participantVariant="caption"
        />
      </div>
    </main>
  );
}

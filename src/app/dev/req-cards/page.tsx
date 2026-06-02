import Link from "next/link";
import { Check, Hand, UserPlus, Users, UsersRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type ReqCardMember } from "@/components/shared/req-card";
import { INTEREST_CHIPS } from "@/data/interests";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type InterestId = (typeof INTEREST_CHIPS)[number]["id"];

type RequestCardSample = {
  scenario: string;
  href: string;
  location: string;
  date: string;
  mode: "private" | "assembly";
  guideState: "waiting" | "found";
  groupSize: number;
  datesFlexible: boolean;
  interests: InterestId[];
  members: ReqCardMember[];
  price: string;
};

type GroupTypeBadgeVariant = "quiet" | "weight" | "weight-icon";

type BadgeVariantSection = {
  variant: GroupTypeBadgeVariant;
  title: string;
  description: string;
};

const samples = [
  {
    scenario: "Своя · Ждёт гида",
    href: "/requests/tbilisi-evening",
    location: "Тбилиси",
    date: "12 июня, 18:00",
    mode: "private",
    guideState: "waiting",
    groupSize: 3,
    datesFlexible: false,
    interests: ["history", "food", "architecture"],
    members: [
      { id: "nino", displayName: "Нино", initials: "Н" },
      { id: "anna", displayName: "Анна", initials: "А" },
      { id: "maxim", displayName: "Максим", initials: "М" },
    ],
    price: "4 500 ₽ / чел",
  },
  {
    scenario: "Своя · Гид найден",
    href: "/requests/kazbegi-one-day",
    location: "Казбеги",
    date: "21 июня, 10:00",
    mode: "private",
    guideState: "found",
    groupSize: 3,
    datesFlexible: true,
    interests: ["nature", "religion", "architecture"],
    members: [
      { id: "mariam", displayName: "Мариам", initials: "М" },
      { id: "roman", displayName: "Роман", initials: "Р" },
      { id: "lena", displayName: "Лена", initials: "Л" },
    ],
    price: "7 900 ₽ / чел",
  },
  {
    scenario: "Сборная · Ждёт гида",
    href: "/requests/kakheti-wine",
    location: "Кахетия",
    date: "5 июля, 11:30",
    mode: "assembly",
    guideState: "waiting",
    groupSize: 4,
    datesFlexible: false,
    interests: ["food", "history", "architecture"],
    members: [
      { id: "tamar", displayName: "Тамар", initials: "Т" },
      { id: "oleg", displayName: "Олег", initials: "О" },
      { id: "katya", displayName: "Катя", initials: "К" },
      { id: "giorgi", displayName: "Георгий", initials: "Г" },
    ],
    price: "6 800 ₽ / чел",
  },
  {
    scenario: "Сборная · Гид найден",
    href: "/requests/svaneti-mountains",
    location: "Сванетия",
    date: "14–16 августа, 09:00",
    mode: "assembly",
    guideState: "found",
    groupSize: 5,
    datesFlexible: true,
    interests: ["nature", "history", "unusual"],
    members: [
      { id: "irakli", displayName: "Ираклий", initials: "И" },
      { id: "sofia", displayName: "София", initials: "С" },
      { id: "daria", displayName: "Дарья", initials: "Д" },
      { id: "levan", displayName: "Леван", initials: "Л" },
    ],
    price: "18 000 ₽ / чел",
  },
] satisfies RequestCardSample[];

const interestLabelMap = new Map(INTEREST_CHIPS.map(({ id, label }) => [id, label]));

const datesFlexibleBadgeClassName =
  "rounded-full bg-surface-low px-2 py-0.5 text-xs font-medium text-ink-2";
const groupTypeBadgeBaseClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium text-ink-2";
const groupTypeBadgeOutlineClassName = `${groupTypeBadgeBaseClassName} border border-border`;
const groupTypeBadgeFilledClassName = `${groupTypeBadgeBaseClassName} bg-surface-low`;
const waitingGuideBadgeClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning";
const foundGuideBadgeClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success";

const badgeVariantSections = [
  {
    variant: "quiet",
    title: "1 · Тихий чип (контроль)",
    description: "Оба типа остаются серыми контурными чипами; различие видно только по слову и базовой иконке.",
  },
  {
    variant: "weight",
    title: "2 · Вес: заливка vs контур",
    description: "Своя группа получает тихую серую заливку, сборная остаётся контурной без цветового акцента.",
  },
  {
    variant: "weight-icon",
    title: "3 · Вес + силуэт иконки",
    description: "К весу добавлен другой силуэт для сборной: UsersRound вместо UserPlus.",
  },
] satisfies BadgeVariantSection[];

function getInterestLabels(interests: InterestId[]) {
  return interests
    .slice(0, 3)
    .map((id) => interestLabelMap.get(id))
    .filter((label): label is NonNullable<typeof label> => label != null);
}

function getGroupLabel(mode: RequestCardSample["mode"]) {
  return mode === "private" ? "Своя группа" : "Сборная";
}

function GuideStatusBadge({ guideState }: { guideState: RequestCardSample["guideState"] }) {
  if (guideState === "found") {
    return (
      <span className={foundGuideBadgeClassName}>
        <Check size={14} className="text-success" /> Гид найден
      </span>
    );
  }

  return (
    <span className={waitingGuideBadgeClassName}>
      <Hand size={14} className="text-warning" /> Ждёт гида
    </span>
  );
}

function getGroupTypeBadgeClassName(mode: RequestCardSample["mode"], variant: GroupTypeBadgeVariant) {
  if (mode === "private" && variant !== "quiet") {
    return groupTypeBadgeFilledClassName;
  }

  return groupTypeBadgeOutlineClassName;
}

function GroupTypeIcon({
  mode,
  variant,
}: {
  mode: RequestCardSample["mode"];
  variant: GroupTypeBadgeVariant;
}) {
  if (mode === "private") {
    return <Users size={14} className="text-ink-2" />;
  }

  if (variant === "weight-icon") {
    return <UsersRound size={14} className="text-ink-2" />;
  }

  return <UserPlus size={14} className="text-ink-2" />;
}

function GroupTypeBadge({
  mode,
  variant,
}: {
  mode: RequestCardSample["mode"];
  variant: GroupTypeBadgeVariant;
}) {
  return (
    <span className={getGroupTypeBadgeClassName(mode, variant)}>
      <GroupTypeIcon mode={mode} variant={variant} /> {getGroupLabel(mode)}
    </span>
  );
}

function AvatarStack({ members }: { members: ReqCardMember[] }) {
  return (
    <div className="flex items-center">
      {members.slice(0, 5).map((member) => (
        <Avatar
          key={member.id}
          className="size-6 -ml-1.5 border-2 border-surface-high first:ml-0"
          title={member.displayName}
        >
          {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={member.displayName} /> : null}
          <AvatarFallback className="bg-surface-low text-[0.5rem] font-semibold">
            {member.initials}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

function RequestCard({ sample, variant }: { sample: RequestCardSample; variant: GroupTypeBadgeVariant }) {
  const interestLabels = getInterestLabels(sample.interests);

  return (
    <Link
      href={sample.href}
      className="flex h-full flex-col bg-surface-high rounded-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
    >
      <p className="text-lg font-semibold text-foreground">{sample.location}</p>
      <p className="mt-1 truncate text-sm text-muted-foreground">
        {sample.date} · {sample.groupSize} чел.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <GuideStatusBadge guideState={sample.guideState} />
        <GroupTypeBadge mode={sample.mode} variant={variant} />
        {sample.datesFlexible ? <span className={datesFlexibleBadgeClassName}>Гибкие даты</span> : null}
      </div>

      {interestLabels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {interestLabels.map((label) => (
            <span key={label} className="rounded-full bg-surface-low px-2 py-0.5 text-xs text-ink-2">
              {label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <AvatarStack members={sample.members} />
        <span className="text-sm font-semibold text-foreground">{sample.price}</span>
      </div>
    </Link>
  );
}

export default function DevReqCardsPage() {
  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Карточки запросов — сравнение меток группы</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Цвет несёт только статус гида (янтарь «Ждёт гида» / тихий зелёный «Гид найден»). Ниже —
          три трактовки серой метки типа группы на одних и тех же четырёх сценариях.
        </p>
      </div>

      <div className="space-y-10">
        {badgeVariantSections.map((section) => (
          <section key={section.variant} aria-labelledby={`${section.variant}-heading`}>
            <div className="mb-4">
              <h2
                id={`${section.variant}-heading`}
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {samples.map((sample) => (
                <div key={`${section.variant}-${sample.href}`} className="flex h-full flex-col space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {sample.scenario}
                  </p>
                  <RequestCard sample={sample} variant={section.variant} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

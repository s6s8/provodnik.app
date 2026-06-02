import Link from "next/link";

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
  groupSize: number;
  datesFlexible: boolean;
  interests: InterestId[];
  members: ReqCardMember[];
  price: string;
};

type FlexVariant = "hybrid";

const samples = [
  {
    scenario: "Своя группа + точная дата",
    href: "/requests/tbilisi-evening",
    location: "Тбилиси",
    date: "12 июня, 18:00",
    mode: "private",
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
    scenario: "Своя группа + гибкая дата",
    href: "/requests/kazbegi-one-day",
    location: "Казбеги",
    date: "21 июня, 10:00",
    mode: "private",
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
    scenario: "Сборная группа + точная дата",
    href: "/requests/kakheti-wine",
    location: "Кахетия",
    date: "5 июля, 11:30",
    mode: "assembly",
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
    scenario: "Сборная группа + гибкая дата",
    href: "/requests/svaneti-mountains",
    location: "Сванетия",
    date: "14–16 августа, 09:00",
    mode: "assembly",
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

const flexBadgeVariantConfig = {
  hybrid: {
    className: "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
    openGroupLabel: "Сборная группа",
    datesFlexibleLabel: "Гибкие даты",
  },
} satisfies Record<
  FlexVariant,
  {
    className: string;
    openGroupLabel: string;
    datesFlexibleLabel: string;
  }
>;

const interestLabelMap = new Map(INTEREST_CHIPS.map(({ id, label }) => [id, label]));

function getInterestLabels(interests: InterestId[]) {
  return interests
    .slice(0, 3)
    .map((id) => interestLabelMap.get(id))
    .filter((label): label is NonNullable<typeof label> => label != null);
}

function formatSampleGroupLine({ mode, groupSize }: Pick<RequestCardSample, "mode" | "groupSize">) {
  return mode === "private" ? `Своя группа · ${groupSize} чел.` : `Сборная группа · ${groupSize} чел.`;
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

function QuietReqCard({
  sample,
  flexVariant,
}: {
  sample: RequestCardSample;
  flexVariant: FlexVariant;
}) {
  const interestLabels = getInterestLabels(sample.interests);
  const groupLine = formatSampleGroupLine(sample);
  const hasFlexBadges = sample.mode === "assembly" || sample.datesFlexible;
  const flexBadgeConfig = flexBadgeVariantConfig[flexVariant];

  return (
    <Link
      href={sample.href}
      className="flex h-full flex-col bg-surface-high rounded-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
    >
      <p className="text-lg font-semibold text-foreground">{sample.location}</p>
      <p className="mt-1 truncate text-sm text-muted-foreground">
        {sample.date} · {groupLine}
      </p>
      {hasFlexBadges ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sample.mode === "assembly" ? (
            <span className={flexBadgeConfig.className}>{flexBadgeConfig.openGroupLabel}</span>
          ) : null}
          {sample.datesFlexible ? (
            <span className={flexBadgeConfig.className}>{flexBadgeConfig.datesFlexibleLabel}</span>
          ) : null}
        </div>
      ) : null}

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

function RequestCardGrid({
  flexVariant,
  className,
}: {
  flexVariant: FlexVariant;
  className: string;
}) {
  return (
    <div className={className}>
      {samples.map((sample) => (
        <div key={sample.href} className="flex h-full flex-col space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {sample.scenario}
          </p>
          <QuietReqCard sample={sample} flexVariant={flexVariant} />
        </div>
      ))}
    </div>
  );
}

export default function DevReqCardsPage() {
  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Карточки запросов — 3 колонки</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Адаптивная сетка с четырьмя сценариями: дата точная или гибкая, группа своя или
          сборная.
        </p>
      </div>

      <RequestCardGrid
        flexVariant="hybrid"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      />
    </main>
  );
}

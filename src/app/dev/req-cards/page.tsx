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
  peopleLabel: string;
  interests: InterestId[];
  members: ReqCardMember[];
  price: string;
};

const samples = [
  {
    scenario: "Точная дата + точное число",
    href: "/requests/tbilisi-evening",
    location: "Тбилиси",
    date: "12 июня, 18:00",
    peopleLabel: "3 человека",
    interests: ["history", "food", "architecture"],
    members: [
      { id: "nino", displayName: "Нино", initials: "Н" },
      { id: "anna", displayName: "Анна", initials: "А" },
      { id: "maxim", displayName: "Максим", initials: "М" },
    ],
    price: "4 500 ₽ / чел",
  },
  {
    scenario: "Гибкая дата + точное число",
    href: "/requests/kazbegi-one-day",
    location: "Казбеги",
    date: "Июнь, даты гибкие",
    peopleLabel: "3 человека",
    interests: ["nature", "religion", "architecture"],
    members: [
      { id: "mariam", displayName: "Мариам", initials: "М" },
      { id: "roman", displayName: "Роман", initials: "Р" },
      { id: "lena", displayName: "Лена", initials: "Л" },
    ],
    price: "7 900 ₽ / чел",
  },
  {
    scenario: "Точная дата + диапазон людей",
    href: "/requests/batumi-family",
    location: "Батуми",
    date: "5 июля, 11:30",
    peopleLabel: "2–4 человека",
    interests: ["kids", "food", "art"],
    members: [
      { id: "tamar", displayName: "Тамар", initials: "Т" },
      { id: "oleg", displayName: "Олег", initials: "О" },
      { id: "katya", displayName: "Катя", initials: "К" },
      { id: "giorgi", displayName: "Георгий", initials: "Г" },
    ],
    price: "5 200 ₽ / чел",
  },
  {
    scenario: "Гибкая дата + диапазон людей",
    href: "/requests/svaneti-mountains",
    location: "Сванетия",
    date: "Лето, даты гибкие",
    peopleLabel: "2–4 человека",
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

function getInterestLabels(interests: InterestId[]) {
  return interests
    .slice(0, 3)
    .map((id) => interestLabelMap.get(id))
    .filter((label): label is NonNullable<typeof label> => label != null);
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

function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function QuietReqCard({ sample }: { sample: RequestCardSample }) {
  const interestLabels = getInterestLabels(sample.interests);

  return (
    <Link
      href={sample.href}
      className="block bg-surface-high rounded-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
    >
      <p className="text-lg font-semibold text-foreground">{sample.location}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {sample.date} · {sample.peopleLabel}
      </p>

      {interestLabels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {interestLabels.map((label) => (
            <span key={label} className="rounded-full bg-surface-low px-2 py-0.5 text-xs text-ink-2">
              {label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <AvatarStack members={sample.members} />
        <span className="text-sm font-semibold text-foreground">{sample.price}</span>
      </div>
    </Link>
  );
}

export default function DevReqCardsPage() {
  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <section>
        <SectionIntro
          title="Спокойный — сценарии гибкости"
          description="Одна карточка на каждый сценарий: дата (точная / гибкая) × число людей (точное / диапазон). Направление — главный акцент, дата и люди тихим текстом, цена — второй акцент."
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          {samples.map((sample) => (
            <div key={sample.href} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {sample.scenario}
              </p>
              <QuietReqCard sample={sample} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

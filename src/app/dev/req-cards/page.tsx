import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReqCard, type ReqCardMember } from "@/components/shared/req-card";
import { INTEREST_CHIPS } from "@/data/interests";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type InterestId = (typeof INTEREST_CHIPS)[number]["id"];

type RequestCardSample = {
  href: string;
  location: string;
  date: string;
  peopleLabel: string;
  interests: InterestId[];
  members: ReqCardMember[];
  price: string;
  imageUrl?: string;
};

const samples = [
  {
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
    price: "от 4 500 ₽ / чел",
    imageUrl:
      "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=900&q=80",
  },
  {
    href: "/requests/svaneti-mountains",
    location: "Сванетия",
    date: "20-21 июня",
    peopleLabel: "4 человека",
    interests: ["nature", "history", "unusual"],
    members: [
      { id: "irakli", displayName: "Ираклий", initials: "И" },
      { id: "sofia", displayName: "София", initials: "С" },
      { id: "daria", displayName: "Дарья", initials: "Д" },
      { id: "levan", displayName: "Леван", initials: "Л" },
    ],
    price: "от 18 000 ₽ / чел",
  },
  {
    href: "/requests/kazbegi-one-day",
    location: "Казбеги",
    date: "28 июня, 09:00",
    peopleLabel: "3 человека",
    interests: ["nature", "religion", "architecture"],
    members: [
      { id: "mariam", displayName: "Мариам", initials: "М" },
      { id: "roman", displayName: "Роман", initials: "Р" },
      { id: "lena", displayName: "Лена", initials: "Л" },
    ],
    price: "от 7 900 ₽ / чел",
    imageUrl:
      "https://images.unsplash.com/photo-1563371327-80bd9cc74d8c?auto=format&fit=crop&w=900&q=80",
  },
  {
    href: "/requests/batumi-family",
    location: "Батуми",
    date: "5 июля, 11:30",
    peopleLabel: "4 человека",
    interests: ["kids", "food", "art"],
    members: [
      { id: "tamar", displayName: "Тамар", initials: "Т" },
      { id: "oleg", displayName: "Олег", initials: "О" },
      { id: "katya", displayName: "Катя", initials: "К" },
      { id: "giorgi", displayName: "Георгий", initials: "Г" },
    ],
    price: "от 5 200 ₽ / чел",
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

function RowReqCard({ sample }: { sample: RequestCardSample }) {
  const meta = [sample.date, sample.peopleLabel, ...getInterestLabels(sample.interests).slice(0, 2)].join(" · ");

  return (
    <Link href={sample.href} className="flex items-center gap-3 bg-surface-high rounded-card p-3 shadow-card">
      {sample.imageUrl ? (
        <Image
          src={sample.imageUrl}
          alt={sample.location}
          width={56}
          height={56}
          sizes="56px"
          className="size-14 shrink-0 rounded-xl bg-surface-low object-cover"
        />
      ) : (
        <div className="size-14 shrink-0 rounded-xl bg-surface-low" aria-hidden="true" />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{sample.location}</p>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">{meta}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-sm font-semibold text-foreground whitespace-nowrap">{sample.price}</span>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
    </Link>
  );
}

function EditorialReqCard({ sample }: { sample: RequestCardSample }) {
  return (
    <Link
      href={sample.href}
      className="block overflow-hidden bg-surface-high rounded-card shadow-card transition-transform hover:-translate-y-0.5"
    >
      {sample.imageUrl ? (
        <Image
          src={sample.imageUrl}
          alt={sample.location}
          width={600}
          height={450}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="aspect-[4/3] w-full object-cover bg-surface-low"
        />
      ) : (
        <div className="aspect-[4/3] w-full bg-surface-low" aria-hidden="true" />
      )}

      <div className="p-4">
        <p className="text-base font-semibold text-foreground">{sample.location}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {sample.date} · {sample.peopleLabel}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <AvatarStack members={sample.members} />
          <span className="text-sm font-semibold text-foreground">{sample.price}</span>
        </div>
      </div>
    </Link>
  );
}

export default function DevReqCardsPage() {
  return (
    <main className="mx-auto max-w-page px-4 py-10 space-y-12">
      <section>
        <SectionIntro title="Текущая" description="Живая карточка из shared-компонента, без изменений." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {samples.map((sample) => (
            <ReqCard
              key={sample.href}
              href={sample.href}
              location={sample.location}
              title={sample.location}
              date={sample.date}
              spotsLabel={sample.peopleLabel}
              interests={sample.interests}
              members={sample.members}
              fillPct={null}
              price={sample.price}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionIntro
          title="Спокойный"
          description="Направление — главный акцент, даты и люди тихим текстом, цена — единственный второй акцент."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {samples.map((sample) => (
            <QuietReqCard key={sample.href} sample={sample} />
          ))}
        </div>
      </section>

      <section>
        <SectionIntro title="Строка" description="Компактная строка: направление, короткая мета и цена." />
        <div className="flex max-w-md flex-col gap-2">
          {samples.map((sample) => (
            <RowReqCard key={sample.href} sample={sample} />
          ))}
        </div>
      </section>

      <section>
        <SectionIntro title="Издательский" description="Изображение сверху, ниже направление, даты, люди и цена." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {samples.map((sample) => (
            <EditorialReqCard key={sample.href} sample={sample} />
          ))}
        </div>
      </section>
    </main>
  );
}

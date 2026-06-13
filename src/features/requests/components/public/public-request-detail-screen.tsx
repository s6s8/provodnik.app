import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Eye,
  ListChecks,
  LogIn,
  UserPlus,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getTheme } from "@/data/themes";
import { JoinGroupButton } from "@/features/requests/components/join-group-button";
import { cn, pluralize } from "@/lib/utils";

export type PublicRequestJoinState = "anon" | "can-join" | "member" | "owner" | "closed";

export type PublicRequestDetailViewModel = {
  title: string;
  regionLabel: string;
  cityImageUrl: string;
  dateLabel: string;
  timeLabel?: string;
  datesFlexible: boolean;
  pricePerPersonRub: number | null;
  memberCount: number;
  members: Array<{ id: string; displayName: string; initials: string; avatarUrl?: string }>;
  organizerName: string;
  themes: string[];
  notes: string;
  joinState: PublicRequestJoinState;
};

type PublicRequestDetailScreenProps = {
  requestId: string;
  viewModel: PublicRequestDetailViewModel;
};

const faqItems = [
  {
    question: "Могу ли я присоединиться к чужой группе?",
    answer:
      "Да. Это сборная группа: можно вступить, пока она открыта, и дальше вместе выбирать предложение гида.",
  },
  {
    question: "Как долго ждать предложения от гидов?",
    answer:
      "Обычно первые ответы появляются в течение дня. Запрос уже виден гидам, которые работают с этим направлением.",
  },
] as const;

const avatarFallbackClassNames = [
  "bg-primary text-primary-foreground",
  "bg-warning text-warning-foreground",
  "bg-muted-foreground text-background",
  "bg-success text-success-foreground",
  "bg-accent text-accent-foreground",
] as const;

function formatPrice(pricePerPersonRub: number | null): string {
  if (!pricePerPersonRub) return "Цена уточняется";
  return `~${new Intl.NumberFormat("ru-RU").format(pricePerPersonRub)} ₽`;
}

function ctaLabel(joinState: PublicRequestJoinState): string {
  switch (joinState) {
    case "anon":
      return "Войти и присоединиться";
    case "can-join":
      return "Присоединиться к группе";
    case "member":
      return "Вы в группе";
    case "owner":
      return "Это ваша группа";
    case "closed":
      return "Группа уже собрана";
  }
}

function JoinCta({
  requestId,
  joinState,
  compact = false,
}: {
  requestId: string;
  joinState: PublicRequestJoinState;
  compact?: boolean;
}) {
  const className = cn(
    "w-full cursor-pointer rounded-[14px] border-primary/60 bg-primary py-4 text-base font-semibold text-primary-foreground shadow-glass hover:bg-primary-hover",
    compact && "py-3.5 text-sm",
  );

  if (joinState === "anon") {
    return (
      <Button asChild className={className}>
        <Link href={`/auth?next=${encodeURIComponent(`/requests/${requestId}`)}`}>
          <LogIn className="size-4" aria-hidden="true" />
          {compact ? "Присоединиться" : ctaLabel(joinState)}
        </Link>
      </Button>
    );
  }

  if (joinState === "can-join") {
    return <JoinGroupButton requestId={requestId} className={className} />;
  }

  if (joinState === "member") {
    return (
      <div className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-success/10 px-4 py-3 text-sm font-semibold text-success">
        <Check className="size-4" aria-hidden="true" />
        {ctaLabel(joinState)}
      </div>
    );
  }

  return (
    <div className="flex min-h-12 items-center justify-center rounded-[14px] bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground">
      {ctaLabel(joinState)}
    </div>
  );
}

function ThemeChips({ themes }: { themes: string[] }) {
  if (themes.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {themes.map((theme) => {
        const themeData = getTheme(theme);
        return (
          <span
            key={theme}
            className="inline-flex rounded-full bg-surface-low px-3.5 py-1.5 text-[0.84rem] font-medium text-foreground"
          >
            {themeData?.label ?? theme}
          </span>
        );
      })}
    </div>
  );
}

function AvatarGroupVisual({ children }: { children: ReactNode }) {
  return <div className="flex -space-x-2.5">{children}</div>;
}

function MemberAvatars({ members }: { members: PublicRequestDetailViewModel["members"] }) {
  return (
    <AvatarGroupVisual>
      {members.slice(0, 5).map((member, index) => (
        <Avatar
          key={member.id}
          className="size-[42px] border-[2.5px] border-background shadow-sm"
          title={member.displayName}
        >
          {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={member.displayName} /> : null}
          <AvatarFallback className={cn("font-semibold", avatarFallbackClassNames[index % avatarFallbackClassNames.length])}>
            {member.initials}
          </AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroupVisual>
  );
}

function DecisionCard({
  requestId,
  viewModel,
}: {
  requestId: string;
  viewModel: PublicRequestDetailViewModel;
}) {
  const price = formatPrice(viewModel.pricePerPersonRub);

  return (
    <aside className="lg:sticky lg:top-[108px]">
      <div className="rounded-[22px] border border-border bg-surface-high p-6 shadow-glass">
        <div className="font-display text-[2rem] font-bold leading-none tracking-[-0.02em] text-foreground">
          {price}{" "}
          {viewModel.pricePerPersonRub ? (
            <small className="text-base font-medium text-muted-foreground">/ с человека</small>
          ) : null}
        </div>
        <p className="mt-3 text-sm leading-[1.55] text-muted-foreground">
          Добор открыт: группа сейчас {viewModel.memberCount}{" "}
          {pluralize(viewModel.memberCount, "человек", "человека", "человек")}. Финальную цену предложат гиды.
        </p>
        <div className="mt-5 hidden lg:block">
          <JoinCta requestId={requestId} joinState={viewModel.joinState} />
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-[0.84rem] text-muted-foreground">
          <Eye className="size-4 text-primary" aria-hidden="true" />
          Гиды уже видят этот запрос
        </div>
      </div>
    </aside>
  );
}

export function PublicRequestDetailScreen({ requestId, viewModel }: PublicRequestDetailScreenProps) {
  const price = formatPrice(viewModel.pricePerPersonRub);
  const hasAbout = viewModel.notes.trim().length > 0;

  return (
    <div className="bg-surface pb-24 lg:pb-0">
      <section className="relative h-[240px] overflow-hidden bg-foreground md:h-[300px]">
        <Image
          src={viewModel.cityImageUrl}
          alt={viewModel.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-foreground/10 via-transparent to-foreground/80"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 z-[2]">
          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] pb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/15 px-3.5 py-1.5 text-[0.82rem] font-medium text-primary-foreground backdrop-blur-[8px]">
              <span className="size-2 rounded-full bg-success shadow-[0_0_0_3px_rgba(127,227,182,0.25)]" aria-hidden="true" />
              Сборная группа
            </span>
            <h1 className="mt-3 font-display text-[clamp(2.1rem,5vw,2.9rem)] font-bold leading-[1.05] tracking-[-0.02em] text-primary-foreground">
              {viewModel.title}
            </h1>
            <p className="mt-1 text-sm text-primary-foreground/80">{viewModel.regionLabel}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-page grid-cols-1 gap-8 px-[clamp(20px,4vw,48px)] py-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-9 lg:pb-24">
        <main>
          <div className="mb-8 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-high px-3.5 py-2 text-sm font-medium text-foreground shadow-sm">
              <CalendarDays className="size-4 text-primary" aria-hidden="true" />
              {viewModel.dateLabel}
            </span>
            {viewModel.timeLabel ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-high px-3.5 py-2 text-sm font-medium text-foreground shadow-sm">
                <Clock3 className="size-4 text-primary" aria-hidden="true" />
                {viewModel.timeLabel}
              </span>
            ) : null}
            {viewModel.datesFlexible ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary shadow-sm">
                <ListChecks className="size-4" aria-hidden="true" />
                Гибкие даты
              </span>
            ) : null}
          </div>

          <section className="mb-8">
            <h2 className="mb-3.5 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Кто едет
            </h2>
            <div className="rounded-[22px] border border-border bg-surface-high p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-[1.2rem] font-semibold text-foreground">
                  В группе сейчас {viewModel.memberCount}{" "}
                  {pluralize(viewModel.memberCount, "человек", "человека", "человек")}
                </p>
                <MemberAvatars members={viewModel.members} />
              </div>
              <p className="mt-3.5 text-sm text-muted-foreground">
                Организатор — <b className="font-semibold text-foreground">{viewModel.organizerName}</b>
              </p>
              <div className="mt-3.5 inline-flex items-center gap-1.5 text-[0.84rem] font-medium text-primary">
                <UserPlus className="size-4" aria-hidden="true" />
                Группа открыта — можно присоединиться
              </div>
            </div>
          </section>

          {hasAbout ? (
            <section className="mb-8">
              <h2 className="mb-3.5 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                О поездке
              </h2>
              <ThemeChips themes={viewModel.themes} />
              <p className="max-w-[60ch] text-[0.97rem] leading-[1.7] text-foreground/85">{viewModel.notes}</p>
            </section>
          ) : null}

          <section className="mb-8">
            <h2 className="mb-3.5 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Как это работает
            </h2>
            <div className="grid gap-3.5 sm:grid-cols-3">
              {["Присоединяешься к группе", "Гиды предлагают условия и цену", "Группа подтверждает бронь"].map(
                (step, index) => (
                  <div key={step} className="rounded-2xl border border-border bg-surface-high p-4 shadow-sm">
                    <div className="mb-2.5 flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-[1.45] text-foreground">{step}</p>
                  </div>
                ),
              )}
            </div>
          </section>

          <section>
            <div className="border-t border-border">
              {faqItems.map((item) => (
                <details key={item.question} className="group border-b border-border">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[0.97rem] font-medium text-foreground marker:hidden">
                    {item.question}
                    <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pb-4 text-sm leading-[1.6] text-muted-foreground">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </main>

        <DecisionCard requestId={requestId} viewModel={viewModel} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-3 border-t border-border bg-surface-high px-4 py-3 shadow-[0_-6px_24px_rgba(10,40,28,0.10)] lg:hidden">
        <div className="shrink-0 font-display text-lg font-bold text-foreground">
          {price}
          {viewModel.pricePerPersonRub ? (
            <small className="block text-xs font-medium text-muted-foreground">с человека</small>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <JoinCta requestId={requestId} joinState={viewModel.joinState} compact />
        </div>
      </div>
    </div>
  );
}

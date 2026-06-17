"use client";

import type { ReactNode } from "react";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Clock3,
  Eye,
  ListChecks,
  LogIn,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INTEREST_CHIPS } from "@/data/interests";
import { kopecksToRub } from "@/data/money";
import type { RequestRecord } from "@/data/supabase/queries";
import { getTheme } from "@/data/themes";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import { BidFormPanel } from "@/features/guide/components/requests/bid-form-panel-lazy";
import { GuideOfferQaPanel } from "@/features/guide/components/requests/guide-offer-qa-panel";
import type { OfferMeta } from "@/features/guide/components/requests/offer-meta";
import { JoinGroupButton } from "@/features/requests/components/join-group-button";
import { CancelRequestButton } from "@/features/traveler/components/requests/cancel-request-button";
import { MarkOffersRead } from "@/features/traveler/components/requests/mark-offers-read";
import { OfferCard } from "@/features/traveler/components/requests/offer-card";
import { TravelerRequestStatusBadge } from "@/features/traveler/components/requests/traveler-request-status";
import { formatTimeRange } from "@/lib/dates";
import { BADGE_CLASS } from "@/lib/styles";
import type { QaThread } from "@/lib/supabase/qa-threads";
import type { GuideOfferRow, TravelerRequestRow } from "@/lib/supabase/types";
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

type OwnerOfferItem = {
  offer: GuideOfferRow;
  guideInfo: {
    guide_id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  qaThread: QaThread | null;
};

type RequestDetailScreenProps =
  | {
      viewerRole: "public";
      requestId: string;
      viewModel: PublicRequestDetailViewModel;
    }
  | {
      viewerRole: "owner";
      requestId: string;
      ownerRecord: TravelerRequestRecord;
      ownerRequestRow: TravelerRequestRow;
      ownerOffers: OwnerOfferItem[];
      onSendQa: (threadId: string, body: string) => Promise<void>;
      onGetOrCreateQaThread: (offerId: string) => Promise<string>;
    }
  | {
      viewerRole: "guide";
      request: RequestRecord;
      isApproved: boolean;
      existingOfferId: string | null;
      offerMeta?: OfferMeta | null;
      competingOffers: number;
      viewsCount: number;
    }
  | {
      viewerRole: "admin";
      requestId?: string;
      viewModel?: PublicRequestDetailViewModel;
    };

const INTEREST_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  INTEREST_CHIPS.map(({ id, label }) => [id, label]),
);

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const chipBase = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
const assemblyChip = `${chipBase} bg-sky-100 text-sky-700`;
const privateChip = `${chipBase} bg-purple-100 text-purple-700`;
const flexibleChip = `${chipBase} bg-emerald-100 text-emerald-700`;
const exactChip = `${chipBase} bg-rose-100 text-rose-700`;
const publicCardClassName =
  "rounded-[24px] border border-[var(--outline-variant)] bg-[var(--surface-lowest)] p-6 shadow-[var(--card-shadow)] md:p-[26px]";
const publicEyebrowClassName =
  "mb-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)]";

function formatPublicPrice(pricePerPersonRub: number | null): string {
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
    "w-full cursor-pointer rounded-[14px] border border-[var(--primary)] bg-[var(--primary)] py-4 text-base font-semibold text-white shadow-[0_14px_28px_-18px_rgba(10,39,30,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-[0_18px_36px_-20px_rgba(10,39,30,0.65)]",
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
            className="inline-flex rounded-full bg-[var(--brand-50)] px-3.5 py-1.5 text-[0.84rem] font-semibold text-[var(--primary)]"
          >
            {themeData?.label ?? theme}
          </span>
        );
      })}
    </div>
  );
}

function AvatarGroupVisual({ children }: { children: ReactNode }) {
  return <div className="flex -space-x-3">{children}</div>;
}

function MemberAvatars({ members }: { members: PublicRequestDetailViewModel["members"] }) {
  return (
    <AvatarGroupVisual>
      {members.slice(0, 5).map((member, index) => (
        <Avatar
          key={member.id}
          className={cn(
            "size-[44px] border-[2.5px] border-white shadow-sm",
            index === 0 && "ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-white",
          )}
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
  const price = formatPublicPrice(viewModel.pricePerPersonRub);

  return (
    <aside className="lg:sticky lg:top-[108px]">
      <div className={cn(publicCardClassName, "lg:p-7")}>
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)]">
          Бронирование
        </p>
        <div className="font-display text-[clamp(2rem,4vw,2.55rem)] font-bold leading-none tracking-[-0.03em] text-[var(--on-surface)]">
          {price}{" "}
          {viewModel.pricePerPersonRub ? (
            <small className="text-base font-medium tracking-normal text-[var(--on-surface-muted)]">
              / с человека
            </small>
          ) : null}
        </div>
        <div className="mt-4 rounded-[16px] bg-[var(--brand-50)] px-4 py-3 text-sm font-medium leading-[1.5] text-[var(--primary)]">
          Ничего не платите сейчас. Финальную цену предложат гиды.
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-[18px] border border-[var(--outline-variant)] bg-white px-4 py-3">
          <MemberAvatars members={viewModel.members} />
          <div className="min-w-0 text-sm leading-[1.4] text-[var(--on-surface-muted)]">
            <span className="mr-1 inline-flex size-2 rounded-full bg-[var(--gold)] shadow-[0_0_0_5px_rgba(224,161,38,0.18)]" />
            Сейчас в группе {viewModel.memberCount}{" "}
            {pluralize(viewModel.memberCount, "человек", "человека", "человек")}
          </div>
        </div>
        <div className="mt-5 hidden lg:block">
          <JoinCta requestId={requestId} joinState={viewModel.joinState} />
        </div>
        <div className="mt-5 grid gap-3 border-t border-[var(--outline-variant)] pt-5 text-[0.84rem] font-medium text-[var(--on-surface-muted)]">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--primary)]">
              <Eye className="size-4" aria-hidden="true" />
            </span>
            Гиды уже видят этот запрос
          </div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--primary)]">
              <Check className="size-4" aria-hidden="true" />
            </span>
            Присоединиться можно без предоплаты
          </div>
        </div>
      </div>
    </aside>
  );
}

function PublicDetailBranch({
  requestId,
  viewModel,
}: {
  requestId: string;
  viewModel: PublicRequestDetailViewModel;
}) {
  const price = formatPublicPrice(viewModel.pricePerPersonRub);
  const hasAbout = viewModel.notes.trim().length > 0;

  return (
    <div className="bg-[var(--surface)] pb-24 lg:pb-0">
      <section className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] pt-6">
        <div className="relative h-[320px] overflow-hidden rounded-[28px] bg-[var(--brand-950)] shadow-[var(--card-shadow)] md:h-[420px]">
          <Image
            src={viewModel.cityImageUrl}
            alt={viewModel.title}
            width={1800}
            height={720}
            priority
            sizes="(min-width: 1200px) 1120px, calc(100vw - 40px)"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,39,30,.12),rgba(10,39,30,.66))]"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 z-[2] p-[clamp(22px,4vw,44px)]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[0.82rem] font-semibold text-[var(--primary)] shadow-[0_10px_24px_rgba(10,39,30,0.16)]">
              <span className="size-2 rounded-full bg-[var(--gold)] shadow-[0_0_0_4px_rgba(224,161,38,0.18)]" aria-hidden="true" />
              Сборная группа
            </span>
            <h1 className="mt-4 font-display text-[clamp(2.75rem,7vw,5.25rem)] font-bold leading-[0.96] tracking-[-0.045em] text-white">
              {viewModel.title}
            </h1>
            <p className="mt-3 text-base font-medium text-white/85 md:text-lg">{viewModel.regionLabel}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-page grid-cols-1 gap-8 px-[clamp(20px,4vw,48px)] py-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-9 lg:pb-24">
        <main className="space-y-8">
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-3 rounded-full border border-[var(--outline-variant)] bg-white px-4 py-3 text-sm font-semibold text-[var(--on-surface)] shadow-[var(--card-shadow)]">
              <span className="flex size-9 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--primary)]">
                <CalendarDays className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--on-surface-muted)]">
                  Когда
                </span>
                {viewModel.dateLabel}
              </span>
            </span>
            {viewModel.timeLabel ? (
              <span className="inline-flex items-center gap-3 rounded-full border border-[var(--outline-variant)] bg-white px-4 py-3 text-sm font-semibold text-[var(--on-surface)] shadow-[var(--card-shadow)]">
                <span className="flex size-9 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--primary)]">
                  <Clock3 className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--on-surface-muted)]">
                    Время
                  </span>
                  {viewModel.timeLabel}
                </span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-3 rounded-full border border-[var(--outline-variant)] bg-white px-4 py-3 text-sm font-semibold text-[var(--on-surface)] shadow-[var(--card-shadow)]">
              <span className="flex size-9 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--primary)]">
                <Users className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--on-surface-muted)]">
                  В группе
                </span>
                {viewModel.memberCount} {pluralize(viewModel.memberCount, "человек", "человека", "человек")}
              </span>
            </span>
            <span className="inline-flex items-center gap-3 rounded-full border border-[var(--outline-variant)] bg-white px-4 py-3 text-sm font-semibold text-[var(--primary)] shadow-[var(--card-shadow)]">
              <span className="flex size-9 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--primary)]">
                <UserPlus className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--on-surface-muted)]">
                  Статус
                </span>
                Открыта для добора
              </span>
            </span>
            {viewModel.datesFlexible ? (
              <span className="inline-flex items-center gap-3 rounded-full border border-[var(--outline-variant)] bg-white px-4 py-3 text-sm font-semibold text-[var(--primary)] shadow-[var(--card-shadow)]">
                <span className="flex size-9 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--primary)]">
                  <ListChecks className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--on-surface-muted)]">
                    Даты
                  </span>
                  Гибкие
                </span>
              </span>
            ) : null}
          </div>

          {hasAbout ? (
            <section className={publicCardClassName}>
              <h2 className={publicEyebrowClassName}>О поездке</h2>
              <ThemeChips themes={viewModel.themes} />
              <p className="max-w-[64ch] text-[1rem] leading-[1.75] text-[var(--ink-2)]">{viewModel.notes}</p>
            </section>
          ) : null}

          <section className={publicCardClassName}>
            <h2 className={publicEyebrowClassName}>Кто едет</h2>
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="font-display text-[1.45rem] font-semibold leading-tight text-[var(--on-surface)]">
                  В группе сейчас {viewModel.memberCount}{" "}
                  {pluralize(viewModel.memberCount, "человек", "человека", "человек")}
                </p>
                <p className="mt-2 text-sm text-[var(--on-surface-muted)]">
                  Организатор — <b className="font-semibold text-[var(--on-surface)]">{viewModel.organizerName}</b>
                </p>
              </div>
              <MemberAvatars members={viewModel.members} />
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-50)] px-4 py-2 text-[0.9rem] font-semibold text-[var(--primary)]">
              <UserPlus className="size-4" aria-hidden="true" />
              Группа открыта — можно присоединиться
            </div>
          </section>

          <section className={publicCardClassName}>
            <h2 className={publicEyebrowClassName}>Как это работает</h2>
            <div className="grid gap-3.5 sm:grid-cols-3">
              {["Присоединяешься к группе", "Гиды предлагают условия и цену", "Группа подтверждает бронь"].map(
                (step, index) => (
                  <div key={step} className="rounded-[18px] bg-[var(--brand-50)] p-4">
                    <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-white text-sm font-bold text-[var(--primary)] shadow-sm">
                      {index + 1}
                    </div>
                    <p className="text-sm font-medium leading-[1.5] text-[var(--on-surface)]">{step}</p>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className={publicCardClassName}>
            <h2 className={publicEyebrowClassName}>FAQ</h2>
            <div className="space-y-3">
              {faqItems.map((item) => (
                <details key={item.question} className="group rounded-[18px] bg-[var(--brand-50)] px-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[0.97rem] font-semibold text-[var(--on-surface)] marker:hidden">
                    {item.question}
                    <ChevronDown className="size-4 text-[var(--primary)] transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pb-4 text-sm leading-[1.65] text-[var(--on-surface-muted)]">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </main>

        <DecisionCard requestId={requestId} viewModel={viewModel} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-3 border-t border-[var(--outline-variant)] bg-white px-4 py-3 shadow-[0_-10px_30px_rgba(10,40,28,0.12)] lg:hidden">
        <div className="shrink-0 font-display text-lg font-bold text-[var(--on-surface)]">
          {price}
          {viewModel.pricePerPersonRub ? (
            <small className="block text-xs font-medium text-[var(--on-surface-muted)]">с человека</small>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <JoinCta requestId={requestId} joinState={viewModel.joinState} compact />
        </div>
      </div>
    </div>
  );
}

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const monthDay = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  return `${monthDay} ${d.getFullYear()}`;
}

function formatPublishedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Опубликован ${date}, ${time}`;
}

function TravelerRequestSummary({ record }: { record: TravelerRequestRecord }) {
  const request = record.request;

  const dateLabel = formatDate(request.startDate);
  const timeLabel = request.startTime
    ? request.endTime
      ? `${request.startTime} – ${request.endTime}`
      : request.startTime
    : "—";

  const isAssembly = request.mode === "assembly";
  const capacity = isAssembly ? request.groupMax ?? null : null;
  const current = isAssembly ? request.groupSizeCurrent ?? 1 : request.groupSize ?? 1;
  const hasCapacity = capacity != null;
  const countLabel = hasCapacity ? `${current} из ${capacity} чел.` : `${current} чел.`;
  const countFull = hasCapacity && current >= capacity;
  const countColor = !hasCapacity
    ? ""
    : countFull
      ? "border-success/30 bg-success/10 text-success"
      : "border-warning/30 bg-warning/10 text-warning";

  const budgetLabel =
    request.budgetPerPersonRub == null
      ? "Бюджет не указан"
      : `${formatRub(request.budgetPerPersonRub)} на чел.`;

  const publishedAt = formatPublishedAt(record.createdAt);
  const interests = request.interests ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" className="-ml-3 px-3">
          <Link href="/trips">
            <ArrowLeft className="size-4" />
            {"Мои запросы"}
          </Link>
        </Button>
        <TravelerRequestStatusBadge status={record.status} />
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              {request.destination}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">{publishedAt}</p>
          </div>
          <CancelRequestButton requestId={record.id} status={record.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              BADGE_CLASS,
              request.mode === "assembly"
                ? "border-sky-200 bg-sky-100 text-sky-700"
                : "border-purple-200 bg-purple-100 text-purple-700",
            )}
          >
            {request.mode === "assembly" ? "Сборная группа" : "Своя группа"}
          </Badge>
          <Badge variant="outline" className={BADGE_CLASS}>
            <CalendarDays className="size-3.5" />
            {dateLabel}
          </Badge>
          {request.dateFlexibility && request.dateFlexibility !== "exact" && (
            <Badge variant="outline" className={cn(BADGE_CLASS, "border-emerald-200 bg-emerald-100 text-emerald-700")}>
              ±пара дней
            </Badge>
          )}
          <Badge variant="outline" className={BADGE_CLASS}>
            <Clock className="size-3.5" />
            {timeLabel}
          </Badge>
          <Badge variant="outline" className={cn(BADGE_CLASS, countColor)}>
            <Users className="size-3.5" />
            {countLabel}
          </Badge>
          <Badge
            variant="outline"
            className={cn(BADGE_CLASS, "border-success/30 bg-success/10 text-success")}
          >
            <Wallet className="size-3.5" />
            {budgetLabel}
          </Badge>
          {record.dateLocked === false && (
            <Badge variant="outline" className={cn(BADGE_CLASS, "border-emerald-200 bg-emerald-100 text-emerald-700")}>
              Гид может предлагать даты
            </Badge>
          )}
        </div>

        {interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((slug) => (
              <Badge key={slug} variant="secondary" className={BADGE_CLASS}>
                {INTEREST_LABEL_BY_ID[slug] ?? slug}
              </Badge>
            ))}
          </div>
        ) : null}

        {request.notes ? (
          <div className="w-full max-w-[720px] whitespace-pre-line rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm text-foreground">
            {request.notes}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OwnerDetailBranch({
  requestId,
  ownerRecord,
  ownerRequestRow,
  ownerOffers,
  onSendQa,
  onGetOrCreateQaThread,
}: Extract<RequestDetailScreenProps, { viewerRole: "owner" }>) {
  const pendingOffers = ownerOffers.filter(({ offer }) => offer.status === "pending");

  return (
    <div className="flex flex-col gap-8">
      <TravelerRequestSummary record={ownerRecord} />
      <MarkOffersRead requestId={requestId} hasOffers={ownerOffers.length > 0} />
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold leading-none text-foreground">
            Предложения гидов
          </h2>
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/12 px-1.5 font-sans text-xs font-semibold text-primary">
            {pendingOffers.length}
          </span>
        </div>

        {pendingOffers.length === 0 ? (
          <div className="rounded-xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Пока нет предложений. Гиды увидят ваш запрос и ответят в ближайшее время.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingOffers.map(({ offer, guideInfo, qaThread }) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                guideInfo={guideInfo}
                qaThread={qaThread}
                requestId={requestId}
                requestStatus={ownerRequestRow.status}
                onSendQa={onSendQa}
                onGetOrCreateQaThread={onGetOrCreateQaThread}
                travelerDateLocked={ownerRequestRow.date_locked ?? true}
                travelerTimeLocked={ownerRequestRow.time_locked ?? true}
                travelerCountLocked={ownerRequestRow.count_locked ?? true}
                travelerBudgetLocked={ownerRequestRow.budget_locked ?? true}
                travelerStartsOn={ownerRequestRow.starts_on ?? null}
                travelerStartTime={ownerRequestRow.start_time ?? null}
                travelerEndTime={ownerRequestRow.end_time ?? null}
                travelerOpenToJoin={ownerRequestRow.open_to_join}
                travelerCount={ownerRequestRow.participants_count ?? 1}
                travelerBudgetPerPersonRub={ownerRequestRow.budget_minor ? Math.round(kopecksToRub(ownerRequestRow.budget_minor)) : null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatViewsLabel(count: number): string {
  if (count <= 0) return "Вы первый, кто открыл этот запрос";
  const mod10 = count % 10;
  const mod100 = count % 100;
  let noun = "гидов";
  if (mod10 === 1 && mod100 !== 11) noun = "гид";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) noun = "гида";
  const verb = noun === "гид" ? "посмотрел" : "посмотрели";
  return `${count} ${noun} ${verb} этот запрос`;
}

function formatCompetingOffersLabel(count: number, hasOwnOffer: boolean): string {
  const others = hasOwnOffer ? Math.max(0, count - 1) : count;
  if (others <= 0) {
    return hasOwnOffer
      ? "Вы пока единственный гид"
      : "Пока ни одного предложения";
  }
  const mod10 = others % 10;
  const mod100 = others % 100;
  let noun = "гидов";
  if (mod10 === 1 && mod100 !== 11) noun = "гид";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) noun = "гида";
  const verb = noun === "гид" ? "уже отправил предложение" : "уже отправили предложения";
  return `${others} ${noun} ${verb}`;
}

function GuideDetailBranch({
  request,
  isApproved,
  existingOfferId,
  offerMeta,
  competingOffers,
  viewsCount,
}: Extract<RequestDetailScreenProps, { viewerRole: "guide" }>) {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [offerId, setOfferId] = React.useState<string | null>(existingOfferId);

  React.useEffect(() => {
    setOfferId(existingOfferId);
  }, [existingOfferId]);

  const interestsLabel = request.interests
    .map((s) => INTEREST_LABEL_BY_ID[s] ?? s)
    .join(" · ");
  const validOfferId = offerId && UUID_RE.test(offerId) ? offerId : null;
  const hasFlexibleDates =
    request.dateFlexibility === "few_days" || request.date_locked === false;

  return (
    <div className="space-y-6">
      <Link
        href="/guide/inbox"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Назад к запросам
      </Link>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-2">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-base font-bold"
              aria-hidden="true"
            >
              {request.requesterInitials}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{request.requesterName}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                в{" "}
                <span className="font-medium text-foreground">
                  {request.destination}
                </span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground shrink-0">
              {formatDateTime(request.createdAt)}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Запрос путешественника
          </p>

          {interestsLabel ? (
            <div>
              <span className="inline-flex items-center gap-1.5 whitespace-normal rounded-full bg-primary/10 px-2.5 py-1 font-sans text-[11px] font-semibold tracking-[0.02em] text-primary">
                {interestsLabel}
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <span className={request.mode === "assembly" ? assemblyChip : privateChip}>
              {request.mode === "assembly" ? "Сборная группа" : "Своя группа"}
            </span>
            <span className={hasFlexibleDates ? flexibleChip : exactChip}>
              {hasFlexibleDates ? "Гибкие даты" : "Точная дата"}
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm">
              <span className="font-medium text-foreground">Даты:</span>{" "}
              <span className="text-muted-foreground">{request.dateLabel}</span>
              {formatTimeRange(request.startTime, request.endTime) && (
                <>
                  {" · "}
                  <span className="font-medium text-foreground">Время:</span>{" "}
                  <span className="text-muted-foreground">
                    {formatTimeRange(request.startTime, request.endTime)}
                  </span>
                </>
              )}
            </p>
            <p className="text-sm">
              <span className="font-medium text-foreground">Бюджет:</span>{" "}
              <span className="text-muted-foreground">
                {request.budgetLabel} · {request.groupSize} чел.
              </span>
            </p>
          </div>

          <div className="border-t border-border/50 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Описание
            </p>
            {request.description ? (
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {request.description}
              </p>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground/60">
                Путешественник не оставил описание.
              </p>
            )}
          </div>

          <div
            className="flex flex-col gap-1.5 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <Eye className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{formatViewsLabel(viewsCount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{formatCompetingOffersLabel(competingOffers, validOfferId !== null)}</span>
            </div>
          </div>

          {validOfferId ? (
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">
                Ваш отклик
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-sans text-xs font-semibold tracking-[0.02em] text-primary">
                ✓ Предложение отправлено
              </span>
              {offerMeta &&
                (offerMeta.starts_at != null ||
                  offerMeta.capacity != null ||
                  offerMeta.price_minor != null ||
                  offerMeta.message != null) ? (
                <div className="space-y-2">
                  <p className="text-sm text-foreground/80">
                    {offerMeta.starts_at
                      ? new Date(offerMeta.starts_at).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                        })
                      : ""}
                    {offerMeta.capacity != null ? ` · ${offerMeta.capacity} чел.` : ""}
                    {offerMeta.price_minor != null
                      ? ` · ${Math.round(
                          kopecksToRub(offerMeta.price_minor) / (offerMeta.capacity ?? 1),
                        ).toLocaleString("ru-RU")} ₽/чел.`
                      : ""}
                  </p>
                  {offerMeta.message ? (
                    <div className="rounded-md border border-primary/15 bg-background/70 p-3">
                      <p className="mb-1 text-xs font-medium text-primary/60">
                        Сообщение путешественнику
                      </p>
                      <p className="text-sm whitespace-pre-line">{offerMeta.message}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="border-t border-primary/15 pt-3">
                <GuideOfferQaPanel offerId={validOfferId} />
              </div>
            </div>
          ) : isApproved ? (
            <Button
              variant="default"
              size="default"
              onClick={() => setPanelOpen(true)}
            >
              Сделать предложение
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="default" size="default" disabled>
                Доступно после верификации
              </Button>
              <Link
                href="/guide/profile#verification"
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                Пройти верификацию →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {panelOpen ? (
        <BidFormPanel
          requestId={request.id}
          request={request}
          onClose={() => setPanelOpen(false)}
          onSuccess={() => {
            setPanelOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

export function RequestDetailScreen(props: RequestDetailScreenProps) {
  switch (props.viewerRole) {
    case "public":
      return <PublicDetailBranch requestId={props.requestId} viewModel={props.viewModel} />;
    case "owner":
      return <OwnerDetailBranch {...props} />;
    case "guide":
      return <GuideDetailBranch {...props} />;
    case "admin":
      if (props.requestId && props.viewModel) {
        return <PublicDetailBranch requestId={props.requestId} viewModel={props.viewModel} />;
      }
      return null;
  }
}

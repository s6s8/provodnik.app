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
    rating: number | null;
    review_count: number | null;
    verified: boolean;
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
  const price = formatPublicPrice(viewModel.pricePerPersonRub);

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
    <div className="bg-surface pb-24 lg:pb-0">
      <section className="relative h-[240px] overflow-hidden bg-foreground md:h-[300px]">
        <Image
          src={viewModel.cityImageUrl}
          alt={viewModel.title}
          width={1800}
          height={600}
          priority
          sizes="100vw"
          className="h-[240px] w-full object-cover md:h-[300px]"
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
  const acceptedOffers = ownerOffers.filter(({ offer }) => offer.status === "accepted");
  const declinedOffers = ownerOffers.filter(({ offer }) => offer.status === "declined");
  const pendingOffers = ownerOffers.filter(({ offer }) => offer.status === "pending");
  const acceptedOffer = acceptedOffers[0] ?? null;

  const renderOfferCard = ({ offer, guideInfo, qaThread }: OwnerOfferItem) => (
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
  );

  return (
    <div className="flex flex-col gap-8">
      <TravelerRequestSummary record={ownerRecord} />
      <MarkOffersRead requestId={requestId} hasOffers={ownerOffers.length > 0} />
      {acceptedOffer ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold leading-none text-foreground">
              Вы выбрали гида
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 font-sans text-xs font-semibold text-success">
              <Check className="size-3.5" aria-hidden="true" />
              Бронь
            </span>
          </div>

          <div className="rounded-2xl border border-success/40 bg-success/5 p-1">
            {renderOfferCard(acceptedOffer)}
          </div>

          {declinedOffers.length > 0 ? (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Другие предложения
              </h3>
              <div className="flex flex-col gap-4 opacity-60">
                {declinedOffers.map(({ offer, guideInfo, qaThread }) => (
                  <div key={offer.id} className="relative">
                    <span className="absolute right-3 top-3 z-10 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-sans text-xs font-medium text-muted-foreground">
                      Отклонено
                    </span>
                    {renderOfferCard({ offer, guideInfo, qaThread })}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : (
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
              {pendingOffers.map((item) => renderOfferCard(item))}
            </div>
          )}
        </section>
      )}
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

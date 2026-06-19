"use client";

import type { ReactNode } from "react";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  LogIn,
  Users,
  Wallet,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INTEREST_CHIPS } from "@/data/interests";
import { kopecksToRub } from "@/data/money";
import type { RequestRecord } from "@/data/supabase/queries";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import { BidFormPanel } from "@/features/guide/components/requests/bid-form-panel-lazy";
import { GuideOfferQaPanel } from "@/features/guide/components/requests/guide-offer-qa-panel";
import type { OfferMeta } from "@/features/guide/components/requests/offer-meta";
import { JoinGroupButton } from "@/features/requests/components/join-group-button";
import { CancelRequestButton } from "@/features/traveler/components/requests/cancel-request-button";
import { MarkOffersRead } from "@/features/traveler/components/requests/mark-offers-read";
import { OfferCard } from "@/features/traveler/components/requests/offer-card";
import { AcceptOfferButton } from "@/features/traveler/components/requests/accept-offer-button";
import { BiddingGuidesTeaser } from "@/components/shared/bidding-guides-teaser";
import { ImmersiveHero } from "@/components/shared/immersive-hero";
import { RequestFactsPanel } from "@/components/shared/request-facts-panel";
import { TripPanel } from "@/components/shared/trip-panel";
import { GuideOfferCard, type GuideCardInfo } from "@/components/shared/guide-offer-card";
import { StickyActionBar } from "@/components/shared/sticky-action-bar";
import { TravelerRequestStatusBadge } from "@/features/traveler/components/requests/traveler-request-status";
import { withdrawOfferAction } from "@/features/guide/offer-actions";
import { cityImage } from "@/lib/city-image";
import { formatTimeRange } from "@/lib/dates";
import { BADGE_CLASS } from "@/lib/styles";
import type { QaThread } from "@/lib/supabase/qa-threads";
import type { BiddingGuide } from "@/lib/supabase/requests-public";
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
    years_experience: number | null;
    trips_completed: number | null;
    recommend_pct: number | null;
    languages: string[];
    specialties: string[];
  } | null;
  qaThread: QaThread | null;
};

type RequestDetailScreenProps =
  | {
      viewerRole: "public";
      requestId: string;
      viewModel: PublicRequestDetailViewModel;
      biddingGuides?: BiddingGuide[];
    }
  | {
      viewerRole: "owner";
      requestId: string;
      ownerRecord: TravelerRequestRecord;
      ownerRequestRow: TravelerRequestRow;
      ownerOffers: OwnerOfferItem[];
      viewModel: PublicRequestDetailViewModel;
      justCreated?: boolean;
      createdMode?: string | null;
      onSendQa: (threadId: string, body: string) => Promise<void>;
      onGetOrCreateQaThread: (offerId: string) => Promise<string>;
    }
  | {
      viewerRole: "guide";
      request: RequestRecord;
      isApproved: boolean;
      existingOfferId: string | null;
      offerMeta?: OfferMeta | null;
      existingOffer?: GuideOfferRow | null;
      competingOffers: number;
      viewsCount: number;
    }
  | {
      viewerRole: "admin";
      requestId?: string;
      viewModel?: PublicRequestDetailViewModel;
      biddingGuides?: BiddingGuide[];
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

function PublicDetailBranch({
  requestId,
  viewModel,
  biddingGuides,
}: {
  requestId: string;
  viewModel: PublicRequestDetailViewModel;
  biddingGuides: BiddingGuide[];
}) {
  const price = formatPublicPrice(viewModel.pricePerPersonRub);
  const hasAbout = viewModel.notes.trim().length > 0;

  return (
    <>
      <ImmersiveHero
        className="-mt-nav-h"
        imageUrl={viewModel.cityImageUrl}
        breadcrumb={[{ label: "Поездки" }, { label: viewModel.regionLabel }, { label: viewModel.title }]}
        title={viewModel.title}
        intro={hasAbout ? viewModel.notes : undefined}
      >
        <TripPanel
          dateLabel={viewModel.dateLabel}
          timeLabel={viewModel.timeLabel}
          footer={
            <div className="flex flex-col gap-3">
              <div className="font-display text-[26px] font-bold leading-none tracking-[-0.02em] text-on-surface">
                {price}
                {viewModel.pricePerPersonRub ? (
                  <span className="ml-1 text-[15px] font-medium text-on-surface-muted">/ с человека</span>
                ) : null}
              </div>
              <p className="text-[13px] leading-[1.5] text-on-surface-muted">
                Добор открыт: в группе сейчас {viewModel.memberCount}{" "}
                {pluralize(viewModel.memberCount, "человек", "человека", "человек")}. Финальную цену предложат гиды.
              </p>
              <div className="hidden lg:block">
                <JoinCta requestId={requestId} joinState={viewModel.joinState} />
              </div>
            </div>
          }
        />
      </ImmersiveHero>

      <div className="mx-auto w-full max-w-page px-5 pb-32 md:px-8">
        {/* Кто едет — preserve member social proof */}
        <section className="flex flex-col gap-4 pt-[54px]">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-primary">Кто едет</div>
          <div className="rounded-[16px] border border-border bg-surface-lowest p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[20px] font-semibold text-on-surface">
                В группе сейчас {viewModel.memberCount}{" "}
                {pluralize(viewModel.memberCount, "человек", "человека", "человек")}
              </p>
              <MemberAvatars members={viewModel.members} />
            </div>
            <p className="mt-3 text-sm text-on-surface-muted">
              Организатор — <b className="font-semibold text-on-surface">{viewModel.organizerName}</b>
            </p>
          </div>
        </section>

        {/* Social-proof teaser — renders nothing if no real bidders */}
        <div className="pt-[54px]">
          <BiddingGuidesTeaser guides={biddingGuides} />
        </div>

        {/* Как это работает + off-platform reassurance */}
        <section className="flex flex-col gap-4 pt-[54px]">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-primary">Как это работает</div>
          <div className="grid gap-3.5 sm:grid-cols-3">
            {["Присоединяешься к группе", "Гиды предлагают условия и цену", "Группа подтверждает бронь"].map((step, index) => (
              <div key={step} className="rounded-[16px] border border-border bg-surface-lowest p-4">
                <div className="mb-2.5 flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</div>
                <p className="text-sm leading-[1.45] text-on-surface">{step}</p>
              </div>
            ))}
          </div>
          <p className="text-[13.5px] text-on-surface-muted">Договорённость и оплата — напрямую с гидом.</p>
        </section>

        {/* FAQ */}
        <section className="pt-[54px]">
          <div className="border-t border-border">
            {faqItems.map((item) => (
              <details key={item.question} className="group border-b border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[0.97rem] font-medium text-on-surface marker:hidden">
                  {item.question}
                  <ChevronDown className="size-4 text-on-surface-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="pb-4 text-sm leading-[1.6] text-on-surface-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* Mobile sticky join bar — preserved */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-3 border-t border-border bg-surface-lowest px-4 py-3 shadow-glass lg:hidden">
        <div className="shrink-0 font-display text-lg font-bold text-on-surface">
          {price}
          {viewModel.pricePerPersonRub ? (
            <small className="block text-xs font-medium text-on-surface-muted">с человека</small>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <JoinCta requestId={requestId} joinState={viewModel.joinState} compact />
        </div>
      </div>
    </>
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
  viewModel,
  justCreated,
  createdMode,
  onSendQa,
  onGetOrCreateQaThread,
}: Extract<RequestDetailScreenProps, { viewerRole: "owner" }>) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const acceptedOffers = ownerOffers.filter(({ offer }) => offer.status === "accepted");
  const declinedOffers = ownerOffers.filter(({ offer }) => offer.status === "declined");
  const pendingOffers = ownerOffers.filter(({ offer }) => offer.status === "pending");
  const acceptedOffer = acceptedOffers[0] ?? null;

  const isOpen = ownerRequestRow.status === "open";
  const seatsTotal = ownerRequestRow.open_to_join ? ownerRequestRow.group_capacity ?? null : null;
  const seatsTaken = viewModel.memberCount;
  const remaining = seatsTotal != null ? Math.max(0, seatsTotal - seatsTaken) : 0;

  const perPersonLabel = (offer: GuideOfferRow): string => {
    const count = offer.capacity > 0 ? offer.capacity : ownerRequestRow.participants_count ?? 1;
    const perMinor = count > 0 ? Math.round(offer.price_minor / count) : offer.price_minor;
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: offer.currency,
      maximumFractionDigits: 0,
    }).format(kopecksToRub(perMinor));
  };

  const cardInfo = (gi: OwnerOfferItem["guideInfo"]): GuideCardInfo => ({
    full_name: gi?.full_name ?? null,
    avatar_url: gi?.avatar_url ?? null,
    rating: gi?.rating ?? null,
    review_count: gi?.review_count ?? null,
    verified: gi?.verified ?? false,
    years_experience: gi?.years_experience ?? null,
    trips_completed: gi?.trips_completed ?? null,
    recommend_pct: gi?.recommend_pct ?? null,
    languages: gi?.languages ?? [],
    specialties: gi?.specialties ?? [],
  });

  const guideName = (gi: OwnerOfferItem["guideInfo"]): string =>
    gi?.full_name && gi.full_name.trim() ? gi.full_name : "Гид";

  const renderEmbeddedDetails = ({ offer, guideInfo, qaThread }: OwnerOfferItem) => (
    <OfferCard
      embedded
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

  const renderGuideCard = (
    item: OwnerOfferItem,
    selectable: boolean,
    forcedSelected = false,
  ) => (
    <div key={item.offer.id} id={`guide-${item.offer.id}`}>
      <GuideOfferCard
        guide={cardInfo(item.guideInfo)}
        name={guideName(item.guideInfo)}
        quote={item.offer.message}
        perPersonPriceLabel={perPersonLabel(item.offer)}
        selected={selectable ? selectedId === item.offer.id : forcedSelected}
        onSelect={
          selectable
            ? () => setSelectedId((prev) => (prev === item.offer.id ? null : item.offer.id))
            : undefined
        }
      >
        {renderEmbeddedDetails(item)}
      </GuideOfferCard>
    </div>
  );

  const breadcrumb = [
    { label: "Поездки" },
    ...(viewModel.regionLabel ? [{ label: viewModel.regionLabel }] : []),
    { label: viewModel.title },
  ];

  const selectedItem = pendingOffers.find(({ offer }) => offer.id === selectedId) ?? null;

  const scrollToSelected = () => {
    if (typeof document === "undefined" || !selectedId) return;
    document
      .getElementById(`guide-${selectedId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <ImmersiveHero
        className="-mt-nav-h"
        imageUrl={viewModel.cityImageUrl}
        breadcrumb={breadcrumb}
        title={viewModel.title}
        intro={viewModel.notes || undefined}
      >
        <TripPanel
          dateLabel={viewModel.dateLabel}
          timeLabel={viewModel.timeLabel}
          status={{ open: isOpen, label: isOpen ? "Группа открыта" : "Группа закрыта" }}
          seatsTaken={seatsTaken}
          seatsTotal={seatsTotal}
          remainingLabel={
            seatsTotal != null && remaining > 0
              ? `Осталось ${remaining} ${pluralize(remaining, "место", "места", "мест")}`
              : undefined
          }
          members={viewModel.members}
          joinedLabel={
            seatsTaken > 0
              ? `Уже присоединились ${seatsTaken} ${pluralize(seatsTaken, "человек", "человека", "человек")}`
              : undefined
          }
        />
      </ImmersiveHero>

      <div className="mx-auto w-full max-w-page px-5 pb-32 md:px-8">
        {justCreated ? (
          <div className="mt-6 rounded-[12px] border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
            {createdMode === "assembly"
              ? "Открытая экскурсия опубликована — гиды увидят ваш запрос и смогут присоединиться."
              : "Запрос отправлен — гиды получат уведомление и ответят в ближайшее время."}
          </div>
        ) : null}

        <MarkOffersRead requestId={requestId} hasOffers={ownerOffers.length > 0} />

        {acceptedOffer ? (
          <section className="flex flex-col gap-5 pt-[54px]">
            <div className="flex items-center gap-3">
              <h2 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-on-surface">
                Вы выбрали гида
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-success">
                <Check className="size-3.5" aria-hidden="true" />
                Бронь
              </span>
            </div>
            {renderGuideCard(acceptedOffer, false, true)}
            {declinedOffers.length > 0 ? (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-on-surface-muted">Другие предложения</h3>
                <div className="flex flex-col gap-4 opacity-60">
                  {declinedOffers.map((item) => renderGuideCard(item, false))}
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="flex flex-col gap-6 pt-[54px]">
            <div>
              <div className="mb-[10px] text-[11.5px] font-semibold uppercase tracking-[0.14em] text-primary">
                Ваши проводники
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-on-surface">
                  Кто покажет вам {viewModel.title}
                </h2>
                {pendingOffers.length > 0 ? (
                  <span className="text-sm text-on-surface-muted">
                    Нажмите на карточку, чтобы выбрать
                  </span>
                ) : null}
              </div>
            </div>

            {pendingOffers.length === 0 ? (
              <div className="rounded-[16px] border border-border bg-card p-6">
                <p className="text-sm text-on-surface-muted">
                  Пока нет предложений. Гиды увидят ваш запрос и ответят в ближайшее время.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingOffers.map((item) => renderGuideCard(item, true))}
              </div>
            )}
          </section>
        )}

        <section className="pt-12">
          <h3 className="mb-4 text-lg font-semibold text-on-surface">Детали вашего запроса</h3>
          <TravelerRequestSummary record={ownerRecord} />
        </section>
      </div>

      {selectedItem && !acceptedOffer ? (
        <StickyActionBar
          avatarUrl={selectedItem.guideInfo?.avatar_url}
          name={guideName(selectedItem.guideInfo)}
          metaLabel={`${perPersonLabel(selectedItem.offer)} / чел.${
            seatsTotal != null
              ? ` · ${isOpen ? "группа открыта" : "группа закрыта"}, ${seatsTaken}/${seatsTotal}`
              : ""
          }`}
          onMessage={scrollToSelected}
          messageLabel="Написать"
          primary={
            isOpen ? (
              <AcceptOfferButton
                offerId={selectedItem.offer.id}
                requestId={requestId}
                guideId={selectedItem.offer.guide_id}
                priceMinor={selectedItem.offer.price_minor}
              />
            ) : null
          }
        />
      ) : null}
    </>
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
  existingOffer,
  competingOffers,
  viewsCount,
}: Extract<RequestDetailScreenProps, { viewerRole: "guide" }>) {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [offerId, setOfferId] = React.useState<string | null>(existingOfferId);
  const [editMode, setEditMode] = React.useState(false);
  const [withdrawing, setWithdrawing] = React.useState(false);

  React.useEffect(() => {
    setOfferId(existingOfferId);
  }, [existingOfferId]);

  const validOfferId = offerId && UUID_RE.test(offerId) ? offerId : null;
  const hasFlexibleDates =
    request.dateFlexibility === "few_days" || request.date_locked === false;

  return (
    <>
      <ImmersiveHero
        className="-mt-nav-h"
        imageUrl={cityImage(request.destination)}
        breadcrumb={[{ label: "Запросы" }, { label: request.destination }]}
        title={request.destination}
        intro={request.description || undefined}
      >
        <RequestFactsPanel
          dateLabel={request.dateLabel}
          flexible={hasFlexibleDates}
          timeLabel={formatTimeRange(request.startTime, request.endTime) || undefined}
          groupLabel={`${request.groupSize} ${pluralize(request.groupSize, "человек", "человека", "человек")}`}
          budgetLabel={request.budgetLabel}
          formatLabel={request.mode === "assembly" ? "Сборная группа" : "Своя группа"}
          interests={request.interests.map((s) => INTEREST_LABEL_BY_ID[s] ?? s)}
          viewsLabel={formatViewsLabel(viewsCount)}
          competingLabel={formatCompetingOffersLabel(competingOffers, validOfferId !== null)}
        />
      </ImmersiveHero>

      <div className="mx-auto w-full max-w-page px-5 pb-24 md:px-8">
        <div className="flex items-center gap-2 pt-[54px]">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/12 text-base font-bold text-primary" aria-hidden="true">
            {request.requesterInitials}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-on-surface">{request.requesterName}</p>
            <p className="text-[13px] text-on-surface-muted">Запрос от {formatDateTime(request.createdAt)}</p>
          </div>
        </div>

        <div className="pt-7">
          {/* ACTION ZONE — three states */}
          {!isApproved ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="default" size="default" disabled>Доступно после верификации</Button>
              <Link href="/guide/profile#verification" className="text-xs text-primary underline-offset-2 hover:underline">
                Пройти верификацию →
              </Link>
            </div>
          ) : validOfferId ? (
            <div className="flex flex-col gap-4 rounded-[16px] border border-primary/25 bg-primary/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">Ваш отклик</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Check className="size-3.5" aria-hidden="true" /> Предложение отправлено
                </span>
              </div>
              {offerMeta && (offerMeta.starts_at != null || offerMeta.capacity != null || offerMeta.price_minor != null || offerMeta.message != null) ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-on-surface/80">
                    {offerMeta.starts_at ? new Date(offerMeta.starts_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) : ""}
                    {offerMeta.capacity != null ? ` · ${offerMeta.capacity} чел.` : ""}
                    {offerMeta.price_minor != null ? ` · ${Math.round(kopecksToRub(offerMeta.price_minor) / (offerMeta.capacity ?? 1)).toLocaleString("ru-RU")} ₽/чел.` : ""}
                  </p>
                  {offerMeta.message ? (
                    <div className="rounded-[12px] border border-primary/15 bg-surface-lowest p-3">
                      <p className="mb-1 text-xs font-medium text-primary/60">Сообщение путешественнику</p>
                      <p className="whitespace-pre-line text-sm text-on-surface">{offerMeta.message}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  size="default"
                  disabled={!existingOffer}
                  onClick={() => { setEditMode(true); setPanelOpen(true); }}
                >
                  Редактировать
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  disabled={withdrawing}
                  onClick={async () => {
                    if (!window.confirm("Отозвать предложение? Путешественник больше его не увидит.")) return;
                    setWithdrawing(true);
                    const res = await withdrawOfferAction(validOfferId, request.id);
                    setWithdrawing(false);
                    if ("ok" in res) { setOfferId(null); router.refresh(); }
                    else window.alert(res.error);
                  }}
                >
                  {withdrawing ? "Отзываем…" : "Отозвать"}
                </Button>
              </div>
              <div className="border-t border-primary/15 pt-3">
                <GuideOfferQaPanel offerId={validOfferId} />
              </div>
            </div>
          ) : (
            <Button variant="default" size="default" onClick={() => { setEditMode(false); setPanelOpen(true); }}>
              Сделать предложение
            </Button>
          )}
        </div>
      </div>

      {panelOpen ? (
        <BidFormPanel
          requestId={request.id}
          request={request}
          editOffer={editMode ? existingOffer ?? undefined : undefined}
          onClose={() => { setPanelOpen(false); setEditMode(false); }}
          onSuccess={() => { setPanelOpen(false); setEditMode(false); router.refresh(); }}
        />
      ) : null}
    </>
  );
}

export function RequestDetailScreen(props: RequestDetailScreenProps) {
  switch (props.viewerRole) {
    case "public":
      return (
        <PublicDetailBranch
          requestId={props.requestId}
          viewModel={props.viewModel}
          biddingGuides={props.biddingGuides ?? []}
        />
      );
    case "owner":
      return <OwnerDetailBranch {...props} />;
    case "guide":
      return <GuideDetailBranch {...props} />;
    case "admin":
      if (props.requestId && props.viewModel) {
        return (
          <PublicDetailBranch
            requestId={props.requestId}
            viewModel={props.viewModel}
            biddingGuides={props.biddingGuides ?? []}
          />
        );
      }
      return null;
  }
}

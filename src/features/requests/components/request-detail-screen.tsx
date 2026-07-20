"use client";

import type { ReactNode } from "react";
import * as React from "react";
import Link from "next/link";
import { Accordion } from "radix-ui";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  LogIn,
  Users,
  Wallet,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Tag } from "@/components/ui/tag";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { INTEREST_CHIPS } from "@/data/interests";
import { COPY } from "@/lib/copy";
import { formatRubNumber, kopecksToRub } from "@/data/money";
import type { RequestRecord } from "@/data/supabase/queries";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import { BidFormPanel } from "@/features/guide/components/requests/bid-form-panel-lazy";
import { GuideOfferQaPanel } from "@/features/guide/components/requests/guide-offer-qa-panel";
import type { OfferMeta } from "@/features/guide/components/requests/offer-meta";
import { JoinGroupButton } from "@/features/requests/components/join-group-button";
import { LeaveGroupButton } from "@/features/requests/components/leave-group-button";
import { RequestGroupThread } from "@/features/requests/components/request-group-thread";
import { CancelRequestButton } from "@/features/traveler/components/requests/cancel-request-button";
import { MarkOffersRead } from "@/features/traveler/components/requests/mark-offers-read";
import { OfferCard } from "@/features/traveler/components/requests/offer-card";
import { AcceptOfferButton } from "@/features/traveler/components/requests/accept-offer-button";
import { BiddingGuidesTeaser } from "@/components/shared/bidding-guides-teaser";
import { ImmersiveHero, type HeroBreadcrumbItem } from "@/components/shared/immersive-hero";
import { RequestFactsPanel } from "@/components/shared/request-facts-panel";
import { StepCard } from "@/components/shared/step-card";
import { TripPanel } from "@/components/shared/trip-panel";
import { GuideOfferCard, type GuideCardInfo } from "@/components/shared/guide-offer-card";
import { StickyActionBar } from "@/components/shared/sticky-action-bar";
import { TravelerRequestStatusBadge } from "@/features/traveler/components/requests/traveler-request-status";
import { withdrawOfferAction } from "@/features/guide/offer-actions";
import { rejectOfferAction } from "@/features/requests/owner-request-actions";
import { cityImage } from "@/lib/city-image";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import { formatRussianDate, formatRussianDateTime, formatTimeRange } from "@/lib/dates";
import type { QaThread } from "@/lib/supabase/qa-threads";
import type { GroupMessage } from "@/lib/supabase/request-thread";
import type { BiddingGuide } from "@/lib/supabase/requests-public";
import type { GuideOfferRow, TravelerRequestRow } from "@/lib/supabase/types";
import { cn, pluralize } from "@/lib/utils";

export type PublicRequestJoinState = "anon" | "can-join" | "member" | "owner" | "closed";

/**
 * Request-detail breadcrumb. Root is the public requests marketplace ("Запросы",
 * matching ROUTES.requests) and is clickable; the country-only fallback "Россия"
 * is dropped, "Калмыкия · Россия"-style labels are trimmed to the region, and a
 * region equal to the city is omitted. The city is the current, non-clickable
 * crumb. Replaces the old non-clickable "Поездки > Россия > Москва".
 */
function buildRequestDetailBreadcrumb(
  regionLabel: string,
  title: string,
): HeroBreadcrumbItem[] {
  const items: HeroBreadcrumbItem[] = [{ label: "Запросы", href: "/requests" }];
  const region = (regionLabel.split("·")[0] ?? "").trim();
  if (region && region !== "Россия" && region !== title) {
    items.push({ label: region });
  }
  items.push({ label: title, current: true });
  return items;
}

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
    slug: string | null;
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

/** #42 — group discussion thread payload + composer action, shared by owner/member. */
export type RequestGroupThreadProps = {
  currentUserId: string;
  groupThread: { messages: GroupMessage[] };
  onSendGroupMessage: (body: string) => Promise<{ error: string | null }>;
};

type RequestDetailScreenProps =
  | ({
      viewerRole: "public";
      requestId: string;
      viewModel: PublicRequestDetailViewModel;
      biddingGuides?: BiddingGuide[];
    } & Partial<RequestGroupThreadProps>)
  | ({
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
    } & Partial<RequestGroupThreadProps>)
  | {
      viewerRole: "guide";
      request: RequestRecord;
      /** Published primary location cover; omitted keeps the branded gradient. */
      cityImageUrl?: string;
      isApproved: boolean;
      existingOfferId: string | null;
      offerMeta?: OfferMeta | null;
      existingOffer?: GuideOfferRow | null;
      competingOffers: number;
      viewsCount: number;
    }
  | ({
      viewerRole: "admin";
      requestId?: string;
      viewModel?: PublicRequestDetailViewModel;
      biddingGuides?: BiddingGuide[];
    } & Partial<RequestGroupThreadProps>);

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
  return `${formatRubNumber(pricePerPersonRub)} ₽`;
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
  const className = cn("w-full", compact && "h-11");

  if (joinState === "anon") {
    return (
      <Button asChild size="lg" className={className}>
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
      <div className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-success/10 px-4 py-3 text-sm font-semibold text-success">
        <Check className="size-4" aria-hidden="true" />
        {ctaLabel(joinState)}
      </div>
    );
  }

  return (
    <div className="flex min-h-12 items-center justify-center rounded-card bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground">
      {ctaLabel(joinState)}
    </div>
  );
}

function AvatarGroupVisual({ children }: { children: ReactNode }) {
  // ponytail: negative overlap can't be a gap; child-margin variant is the direct equivalent
  return <div className="flex [&>*+*]:-ml-2.5">{children}</div>;
}

function MemberAvatars({ members }: { members: PublicRequestDetailViewModel["members"] }) {
  return (
    <AvatarGroupVisual>
      {members.slice(0, 5).map((member, index) => (
        <Avatar
          key={member.id}
          className="size-11 border-2 border-background shadow-sm"
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

/** Renders the #42 group discussion when the caller supplied the thread + action. */
function GroupThreadSection({ group }: { group?: Partial<RequestGroupThreadProps> }) {
  if (!group?.groupThread || !group.onSendGroupMessage || !group.currentUserId) {
    return null;
  }
  return (
    <RequestGroupThread
      messages={group.groupThread.messages}
      currentUserId={group.currentUserId}
      onSend={group.onSendGroupMessage}
    />
  );
}

function PublicDetailBranch({
  requestId,
  viewModel,
  biddingGuides,
  group,
}: {
  requestId: string;
  viewModel: PublicRequestDetailViewModel;
  biddingGuides: BiddingGuide[];
  group?: Partial<RequestGroupThreadProps>;
}) {
  const price = formatPublicPrice(viewModel.pricePerPersonRub);
  const hasAbout = viewModel.notes.trim().length > 0;
  // Joined members (and the owner, via OwnerDetailBranch) get the full trip
  // brief below; anonymous/prospective viewers keep the teaser hero lead only.
  const isMember = viewModel.joinState === "member";
  const themes = viewModel.themes;
  const showTripDetails = isMember && (hasAbout || themes.length > 0);

  return (
    <>
      <ImmersiveHero
        navBleed
        variant="compact"
        imageUrl={viewModel.cityImageUrl}
        breadcrumb={buildRequestDetailBreadcrumb(viewModel.regionLabel, viewModel.title)}
        title={viewModel.title}
        intro={hasAbout && !isMember ? viewModel.notes : undefined}
      >
        <TripPanel
          dateLabel={viewModel.dateLabel}
          timeLabel={viewModel.timeLabel}
          footer={
            <div className="flex flex-col gap-3">
              <div className="font-display text-2xl font-bold leading-none tracking-[-0.02em] text-on-surface">
                {price}
                {viewModel.pricePerPersonRub ? (
                  <span className="ml-1 text-sm font-medium text-on-surface-muted">/ с человека</span>
                ) : null}
              </div>
              <p className="text-sm leading-[1.5] text-on-surface-muted">
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
        {/* О поездке — full brief for joined members (owner sees it via RequestFactsCard) */}
        {showTripDetails ? (
          <section className="flex flex-col gap-4 pt-14">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              О поездке
            </div>
            <div className="flex flex-col gap-4 rounded-card border border-border bg-surface-lowest p-6">
              {themes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {themes.map((slug) => (
                    <Tag key={slug} color="primary">
                      {INTEREST_LABEL_BY_ID[slug] ?? slug}
                    </Tag>
                  ))}
                </div>
              ) : null}
              {hasAbout ? (
                <p className="max-w-[70ch] whitespace-pre-line text-sm leading-[1.6] text-on-surface">
                  {viewModel.notes}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Обсуждение группы — joined members coordinate in the open (#42) */}
        {isMember ? <GroupThreadSection group={group} /> : null}

        {/* Кто едет — preserve member social proof */}
        <section className="flex flex-col gap-4 pt-14">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Кто едет</div>
          <div className="rounded-card border border-border bg-surface-lowest p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xl font-semibold text-on-surface">
                В группе сейчас {viewModel.memberCount}{" "}
                {pluralize(viewModel.memberCount, "человек", "человека", "человек")}
              </p>
              <MemberAvatars members={viewModel.members} />
            </div>
            <p className="mt-3 text-sm text-on-surface-muted">
              Организатор — <b className="font-semibold text-on-surface">{viewModel.organizerName}</b>
            </p>
            {isMember ? (
              <div className="mt-4 border-t border-border pt-4">
                <LeaveGroupButton requestId={requestId} className="-ml-3 text-on-surface-muted" />
              </div>
            ) : null}
          </div>
        </section>

        {/* Social-proof teaser — renders nothing if no real bidders */}
        <div className="pt-14">
          <BiddingGuidesTeaser guides={biddingGuides} />
        </div>

        {/* Как это работает + off-platform reassurance */}
        <section className="flex flex-col gap-4 pt-14">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Как это работает</div>
          <div className="grid gap-3.5 sm:grid-cols-3">
            {["Присоединяешься к группе", "Гиды предлагают условия и цену", "Группа подтверждает бронь"].map((step, index) => (
              <StepCard key={step} step={index + 1}>
                {step}
              </StepCard>
            ))}
          </div>
          <p className="text-sm text-on-surface-muted">{COPY.payment.bookingNote}</p>
        </section>

        {/* FAQ */}
        <section className="pt-14">
          <Accordion.Root type="single" collapsible className="border-t border-border">
            {faqItems.map((item) => (
              <Accordion.Item
                key={item.question}
                value={item.question}
                className="group border-b border-border"
              >
                <Accordion.Header className="flex">
                  <Accordion.Trigger className="flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-base font-medium text-on-surface outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40">
                    {item.question}
                    <ChevronDown
                      className="size-4 shrink-0 text-on-surface-muted transition-transform group-data-[state=open]:rotate-180"
                      aria-hidden="true"
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <p className="pb-4 text-sm leading-[1.6] text-on-surface-muted">
                    {item.answer}
                  </p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </section>
      </div>

      {/* Mobile sticky join bar — preserved */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-surface-lowest px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-glass lg:hidden">
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

/** Relative "Ответил N часов/дней назад" from a guide offer's created_at. */
function formatResponseTime(iso: string): string {
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return "";
  const diffMs = Date.now() - created;
  if (diffMs < 0) return "Только что ответил";
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "Ответил меньше часа назад";
  if (hours < 24) {
    return `Ответил ${hours} ${pluralize(hours, "час", "часа", "часов")} назад`;
  }
  const days = Math.floor(hours / 24);
  return `Ответил ${days} ${pluralize(days, "день", "дня", "дней")} назад`;
}

/**
 * Owner-facing request facts — DS canon: format badge + chips + interest tags.
 * Rendered above the offer list so the traveler keeps their own brief in view.
 */
function RequestFactsCard({ record }: { record: TravelerRequestRecord }) {
  const request = record.request;

  const isAssembly = request.mode === "assembly";
  const current = isAssembly ? request.groupSizeCurrent ?? 1 : request.groupSize ?? 1;
  const countLabel = `${current} чел.`;

  const budgetLabel =
    request.budgetPerPersonRub == null
      ? "не указан"
      : `${formatRub(request.budgetPerPersonRub)} / чел.`;

  const publishedAt = `Опубликован ${formatRussianDateTime(record.createdAt)}`;
  const interests = request.interests ?? [];
  const dateLabel = request.endDate && request.endDate !== request.startDate
    ? `${formatRussianDate(request.startDate)} — ${formatRussianDate(request.endDate)}`
    : formatRussianDate(request.startDate);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" className="-ml-3 px-3">
          <Link href="/trips">
            <ArrowLeft className="size-4" />
            {"Мои запросы"}
          </Link>
        </Button>
        <TravelerRequestStatusBadge status={record.status} />
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold tracking-[-0.02em] text-on-surface">
              {request.destination}
            </h3>
            <p className="mt-1 text-xs text-on-surface-muted">{publishedAt}</p>
          </div>
          <CancelRequestButton requestId={record.id} status={record.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-3 py-1 text-sm font-semibold normal-case tracking-normal",
              isAssembly
                ? "border-primary/20 bg-primary-tint text-primary"
                : "border-border bg-surface-low text-muted-foreground",
            )}
          >
            {isAssembly ? "Сборная группа" : "Своя группа"}
          </Badge>
          <Chip label="Дата" value={dateLabel} icon={CalendarDays} />
          <Chip label="Гостей" value={countLabel} icon={Users} />
          <Chip label="Бюджет" value={budgetLabel} icon={Wallet} />
        </div>

        {record.dateLocked === false ? (
          <Tag color="primary">Гид может предлагать даты</Tag>
        ) : null}

        {interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((slug) => (
              <Tag key={slug} color="primary">
                {INTEREST_LABEL_BY_ID[slug] ?? slug}
              </Tag>
            ))}
          </div>
        ) : null}

        {request.notes ? (
          <p className="max-w-[70ch] whitespace-pre-line text-sm leading-[1.6] text-ink-2">
            {request.notes}
          </p>
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
  currentUserId,
  groupThread,
  onSendGroupMessage,
}: Extract<RequestDetailScreenProps, { viewerRole: "owner" }>) {
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [, startReject] = React.useTransition();

  const acceptedOffers = ownerOffers.filter(({ offer }) => offer.status === "accepted");
  const declinedOffers = ownerOffers.filter(({ offer }) => offer.status === "declined");
  const pendingOffers = ownerOffers.filter(({ offer }) => offer.status === "pending");
  const acceptedOffer = acceptedOffers[0] ?? null;

  const isOpen = ownerRequestRow.status === "open";
  const seatsTotal = ownerRequestRow.open_to_join ? ownerRequestRow.group_capacity ?? null : null;
  const seatsTaken = viewModel.memberCount;
  const remaining = seatsTotal != null ? Math.max(0, seatsTotal - seatsTaken) : 0;

  const enrollmentOpen = ownerRequestRow.open_to_join;
  const enrollmentLabel = enrollmentOpen ? "Набор открыт" : "Набор закрыт";

  const requestInterests = ownerRequestRow.interests ?? [];

  const offerCount = (offer: GuideOfferRow): number =>
    offer.capacity > 0 ? offer.capacity : ownerRequestRow.participants_count ?? 1;

  const perPersonRub = (offer: GuideOfferRow): number => {
    const count = offerCount(offer);
    const perMinor = count > 0 ? Math.round(offer.price_minor / count) : offer.price_minor;
    return Math.round(kopecksToRub(perMinor));
  };

  const perPersonLabel = (offer: GuideOfferRow): string =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: offer.currency,
      maximumFractionDigits: 0,
    }).format(perPersonRub(offer));

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
    resolveDisplayName("guide", { full_name: gi?.full_name ?? null });

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

  const matchingSpecialties = (gi: OwnerOfferItem["guideInfo"]): string[] =>
    (gi?.specialties ?? []).filter((s) => requestInterests.includes(s));

  const renderGuideCard = (
    item: OwnerOfferItem,
    selectable: boolean,
    forcedSelected = false,
  ) => {
    const { offer, guideInfo } = item;
    const trips = guideInfo?.trips_completed ?? null;

    return (
      <div key={offer.id} id={`guide-${offer.id}`}>
        <GuideOfferCard
          guide={cardInfo(guideInfo)}
          name={guideName(guideInfo)}
          quote={offer.message}
          responseTimeLabel={formatResponseTime(offer.created_at)}
          profileHref={guideInfo?.slug ? `/guides/${guideInfo.slug}` : undefined}
          isNewGuide={trips == null || trips === 0}
          matchingSpecialties={matchingSpecialties(guideInfo)}
          selected={selectable ? selectedId === offer.id : forcedSelected}
          onSelect={
            selectable
              ? () => setSelectedId((prev) => (prev === offer.id ? null : offer.id))
              : undefined
          }
        >
          {renderEmbeddedDetails(item)}
        </GuideOfferCard>
      </div>
    );
  };

  const handleRejectSelected = () => {
    if (!selectedItem) return;
    const offerId = selectedItem.offer.id;
    const formData = new FormData();
    formData.set("offer_id", offerId);
    formData.set("request_id", requestId);
    startReject(async () => {
      await rejectOfferAction({ error: null }, formData);
      setSelectedId(null);
      router.refresh();
    });
  };

  const breadcrumb = buildRequestDetailBreadcrumb(
    viewModel.regionLabel,
    viewModel.title,
  );

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
        navBleed
        variant="compact"
        imageUrl={viewModel.cityImageUrl}
        breadcrumb={breadcrumb}
        title={viewModel.title}
        intro={viewModel.notes || undefined}
      >
        <TripPanel
          dateLabel={viewModel.dateLabel}
          timeLabel={viewModel.timeLabel}
          enrollmentLabel={enrollmentLabel}
          enrollmentOpen={enrollmentOpen}
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
          <div className="mt-6 rounded-step border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
            {createdMode === "assembly"
              ? "Открытая экскурсия опубликована — гиды увидят ваш запрос и сделают предложение."
              : "Запрос отправлен — гиды получат уведомление и ответят в ближайшее время."}
          </div>
        ) : null}

        <MarkOffersRead requestId={requestId} hasOffers={ownerOffers.length > 0} />

        <section className="pt-14">
          <RequestFactsCard record={ownerRecord} />
        </section>

        {/* Обсуждение группы — owner coordinates with joined members (#42) */}
        <GroupThreadSection
          group={{ currentUserId, groupThread, onSendGroupMessage }}
        />

        {acceptedOffer ? (
          <section className="flex flex-col gap-5 pt-14">
            <div className="flex items-center gap-3">
              <h2 className="text-[length:var(--text-section)] font-bold leading-[1.1] tracking-[-0.03em] text-on-surface">
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
          <section className="flex flex-col gap-6 pt-14">
            <div>
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Ваши проводники
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-[length:var(--text-section)] font-bold leading-[1.1] tracking-[-0.03em] text-on-surface">
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
              <div className="rounded-card border border-border bg-card p-6">
                <p className="text-sm text-on-surface-muted">
                  Пока нет предложений. Гиды увидят ваш запрос и ответят в ближайшее время.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-on-surface-muted">{COPY.payment.bookingNote}</p>
                <p className="text-sm text-on-surface-muted">
                  После выбора гида откроются его контакты и чат.
                </p>
                <div className="flex flex-col gap-4">
                  {pendingOffers.map((item) => renderGuideCard(item, true))}
                </div>
              </>
            )}
          </section>
        )}
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
          messageLabel="Задать вопрос"
          onReject={isOpen ? handleRejectSelected : undefined}
          primary={
            isOpen ? (
              <AcceptOfferButton
                offerId={selectedItem.offer.id}
                guideName={guideName(selectedItem.guideInfo)}
                perPersonLabel={perPersonLabel(selectedItem.offer)}
              />
            ) : null
          }
        />
      ) : null}
    </>
  );
}

function formatViewsLabel(count: number): string {
  if (count <= 0) return "Вы первый, кто открыл этот запрос";
  const noun = pluralize(count, "гид", "гида", "гидов");
  const verb = pluralize(count, "посмотрел", "посмотрели", "посмотрели");
  return `${count} ${noun} ${verb} этот запрос`;
}

function formatCompetingOffersLabel(count: number, hasOwnOffer: boolean): string {
  const others = hasOwnOffer ? Math.max(0, count - 1) : count;
  if (others <= 0) {
    return hasOwnOffer
      ? "Вы пока единственный гид"
      : "Пока ни одного предложения";
  }
  const noun = pluralize(others, "гид", "гида", "гидов");
  const verb = pluralize(
    others,
    "уже отправил предложение",
    "уже отправили предложения",
    "уже отправили предложения",
  );
  return `${others} ${noun} ${verb}`;
}

function GuideDetailBranch({
  request,
  cityImageUrl,
  isApproved,
  existingOfferId,
  offerMeta,
  existingOffer,
  competingOffers,
  viewsCount,
}: Extract<RequestDetailScreenProps, { viewerRole: "guide" }>) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [offerId, setOfferId] = React.useState<string | null>(existingOfferId);
  const [editMode, setEditMode] = React.useState(false);
  const [withdrawing, setWithdrawing] = React.useState(false);
  const [withdrawError, setWithdrawError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setOfferId(existingOfferId), 0);
    return () => window.clearTimeout(timer);
  }, [existingOfferId]);

  const validOfferId = offerId && UUID_RE.test(offerId) ? offerId : null;
  const hasFlexibleDates = request.dateFlexibility === "few_days";

  return (
    <>
      <ImmersiveHero
        navBleed
        variant="compact"
        imageUrl={cityImageUrl ?? cityImage(request.destination)}
        breadcrumb={buildRequestDetailBreadcrumb(request.destination, request.destination)}
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
        <div className="flex items-center gap-2 pt-14">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/12 text-base font-bold text-primary" aria-hidden="true">
            {request.requesterInitials}
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">{request.requesterName}</p>
            <p className="text-sm text-on-surface-muted">Запрос от {formatRussianDateTime(request.createdAt)}</p>
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
            <div className="flex flex-col gap-4 rounded-card border border-primary/25 bg-primary/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">Ваш отклик</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Check className="size-3.5" aria-hidden="true" /> Предложение отправлено
                </span>
              </div>
              {offerMeta && (offerMeta.starts_at != null || offerMeta.capacity != null || offerMeta.price_minor != null || offerMeta.message != null) ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-on-surface/80">
                    {offerMeta.starts_at ? formatRussianDate(offerMeta.starts_at) : ""}
                    {offerMeta.capacity != null ? ` · ${offerMeta.capacity} чел.` : ""}
                    {offerMeta.price_minor != null ? ` · ${Math.round(kopecksToRub(offerMeta.price_minor) / (offerMeta.capacity ?? 1)).toLocaleString("ru-RU")} ₽/чел.` : ""}
                  </p>
                  {offerMeta.message ? (
                    <div className="rounded-step border border-primary/15 bg-surface-lowest p-3">
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
                    const ok = await confirm({
                      title: "Отозвать предложение?",
                      description: "Путешественник больше его не увидит.",
                      confirmText: "Отозвать",
                      cancelText: "Отмена",
                      destructive: true,
                    });
                    if (!ok) return;
                    setWithdrawError(null);
                    setWithdrawing(true);
                    const res = await withdrawOfferAction(validOfferId, request.id);
                    setWithdrawing(false);
                    if ("ok" in res) { setOfferId(null); router.refresh(); }
                    else setWithdrawError(res.error);
                  }}
                >
                  {withdrawing ? "Отзываем…" : "Отозвать"}
                </Button>
              </div>
              {withdrawError ? (
                <Alert
                  variant="destructive"
                  dismissible
                  onDismiss={() => setWithdrawError(null)}
                  className="text-sm leading-[1.5]"
                >
                  {withdrawError}
                </Alert>
              ) : null}
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
      {ConfirmDialog}
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
          group={{
            currentUserId: props.currentUserId,
            groupThread: props.groupThread,
            onSendGroupMessage: props.onSendGroupMessage,
          }}
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

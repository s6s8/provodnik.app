import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, Users, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

import type { TripCardModel, TripPhase } from "./trip-card-types";

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
  const monthDay = d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  return `${monthDay} ${d.getFullYear()}`;
}

function formatDateRange(startsOn: string, endsOn?: string | null) {
  if (!endsOn || endsOn === startsOn) return formatDate(startsOn);
  return `${formatDate(startsOn)} – ${formatDate(endsOn)}`;
}

function formatPublishedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

function formatPeople(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const noun =
    mod10 === 1 && mod100 !== 11
      ? "человек"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "человека"
        : "человек";
  return `${count} ${noun}`;
}

function formatTimeLabel(time: string) {
  return time.slice(0, 5);
}

const factChipClassName =
  "inline-flex items-center gap-2 rounded-full border border-[var(--outline)] bg-[var(--surface-lowest)] px-3 py-1.5 text-xs font-semibold text-[var(--on-surface-muted)]";

const brandChipClassName =
  "inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-50)] px-3 py-1 text-xs font-semibold text-[var(--primary)]";

const neutralChipClassName =
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--outline)] bg-[var(--surface-lowest)] px-3 py-1 text-xs font-semibold text-[var(--on-surface-muted)]";

const statusBaseClassName =
  "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold";

function getStatusBadge(phase: TripPhase): { label: string; className: string } {
  if (phase === "awaiting_decision") {
    return {
      label: "Есть предложения",
      className: `${statusBaseClassName} bg-[var(--gold)] text-white`,
    };
  }

  if (phase === "waiting_offers") {
    return {
      label: "Набирается",
      className: `${statusBaseClassName} bg-[var(--brand-50)] text-[var(--primary)]`,
    };
  }

  if (phase === "today") {
    return {
      label: "Сегодня",
      className: `${statusBaseClassName} bg-[var(--gold)] text-white`,
    };
  }

  if (phase === "completed") {
    return {
      label: "Завершено",
      className: `${statusBaseClassName} border border-[var(--outline)] bg-[var(--surface-lowest)] text-[var(--on-surface-muted)]`,
    };
  }

  return {
    label: "Подтверждено",
    className: `${statusBaseClassName} bg-[var(--brand-50)] text-[var(--primary)]`,
  };
}

function TripStatus({ phase }: { phase: TripPhase }) {
  const status = getStatusBadge(phase);

  return <span className={status.className}>{status.label}</span>;
}

function TripPhoto({
  phase,
  trip,
}: {
  phase: TripPhase;
  trip: TripCardModel;
}) {
  if (phase === "awaiting_decision") {
    const slots = [0, 1, 2].map((i) => trip.topOffersPhotos?.[i] ?? null);

    return (
      <div className="grid overflow-hidden rounded-[20px] border border-[var(--outline)] bg-[var(--surface)] grid-cols-3 gap-1">
        {slots.map((url, i) => (
          <div key={i} data-testid="photo-slot" className="aspect-square">
            {url ? (
              <Image
                unoptimized
                src={url}
                alt={trip.destination}
                width={300}
                height={300}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[var(--surface)]" />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (phase === "waiting_offers") {
    return null; // requests have no «фото места»; card is text-first (city + meta)
  }

  const stop = trip.routeStops?.[0];
  if (!stop) return null;

  return (
    <Image
      unoptimized
      src={stop.photoUrl}
      alt={trip.destination}
      width={1200}
      height={675}
      className="aspect-video w-full rounded-[20px] object-cover"
    />
  );
}

function shouldShowMeetingPoint(phase: TripPhase, startsOn: string): boolean {
  if (phase === "today") return true;
  if (phase !== "upcoming") return false;

  const start = new Date(startsOn).getTime();
  const fortyEightHours = 48 * 3600 * 1000;
  return start - Date.now() <= fortyEightHours;
}

function FlexPills({
  openToJoin,
  datesFlexible,
  groupType,
}: {
  openToJoin?: boolean;
  datesFlexible?: boolean;
  groupType?: "assembly" | "private";
}) {
  if (!openToJoin && !datesFlexible && !groupType) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {groupType ? (
        <span
          className={
            groupType === "assembly"
              ? brandChipClassName
              : neutralChipClassName
          }
        >
          {groupType === "assembly" ? "Сборная группа" : "Своя группа"}
        </span>
      ) : null}
      {openToJoin ? (
        <span className={brandChipClassName}>
          + к группе
        </span>
      ) : null}
      {datesFlexible ? (
        <span className="inline-flex items-center rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-semibold text-white">
          ± даты
        </span>
      ) : null}
    </div>
  );
}

function RequestMetaRow({ trip }: { trip: TripCardModel }) {
  const publishedAt = trip.createdAt ? formatPublishedAt(trip.createdAt) : null;

  if (!trip.openToJoin && !trip.datesFlexible && !trip.groupType && !publishedAt) {
    return null;
  }

  return (
    <div className="flex flex-row items-start justify-between gap-3">
      <FlexPills
        openToJoin={trip.openToJoin}
        datesFlexible={trip.datesFlexible}
        groupType={trip.groupType}
      />
      {publishedAt ? (
        <p className="shrink-0 whitespace-nowrap text-xs text-muted-foreground text-[var(--on-surface-muted)]">
          Опубликован: {publishedAt}
        </p>
      ) : null}
    </div>
  );
}

function RequestFacts({ trip }: { trip: TripCardModel }) {
  const budgetRub = trip.budget ? trip.budget.amount / 100 : null;
  const participantsCount = trip.participantsCount;
  const shouldShowParticipants = participantsCount != null;

  return (
    <div className="flex flex-wrap gap-2">
      <span className={factChipClassName}>
        <CalendarDays className="size-3.5 text-[var(--primary)]" />
        {formatDateRange(trip.startsOn, trip.endsOn)}
      </span>
      {trip.startTime ? (
        <span className={factChipClassName}>
          <Clock className="size-3.5 text-[var(--primary)]" />
          {formatTimeLabel(trip.startTime)}
        </span>
      ) : null}
      {shouldShowParticipants ? (
        <span className={factChipClassName}>
          <Users className="size-3.5 text-[var(--primary)]" />
          {formatPeople(participantsCount)}
        </span>
      ) : null}
      {budgetRub != null ? (
        <span
          className={cn(
            factChipClassName,
            "border-[var(--primary)] bg-[var(--brand-50)] text-[var(--primary)]",
          )}
        >
          <Wallet className="size-3.5" />
          {formatRub(budgetRub)}
        </span>
      ) : null}
    </div>
  );
}

function OfferCount({ count }: { count?: number }) {
  if (!count || count <= 0) return null;

  const mod10 = count % 10;
  const mod100 = count % 100;
  const noun =
    mod10 === 1 && mod100 !== 11
      ? "отклик"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "отклика"
        : "откликов";

  return (
    <span className="inline-flex w-fit items-center rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-semibold text-white">
      {count} {noun}
    </span>
  );
}

function TripCardContent({
  phase,
  trip,
}: {
  phase: TripPhase;
  trip: TripCardModel;
}) {
  const meetingPoint = trip.routeStops?.[0]?.address;
  const isRequestBacked =
    phase === "waiting_offers" || phase === "awaiting_decision";
  const actionLabel = isRequestBacked ? "Смотреть запрос" : "Смотреть поездку";

  return (
    <>
      <TripPhoto phase={phase} trip={trip} />
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h3 className="truncate text-xl font-semibold leading-7 text-[var(--on-surface)]">
              {trip.destination}
            </h3>
          </div>
          <TripStatus phase={phase} />
        </div>

        <RequestFacts trip={trip} />

        {isRequestBacked ? (
          <>
            <RequestMetaRow trip={trip} />
            {phase === "awaiting_decision" ? (
              <OfferCount count={trip.offerCount} />
            ) : null}
          </>
        ) : (
          <FlexPills
            openToJoin={trip.openToJoin}
            datesFlexible={trip.datesFlexible}
            groupType={trip.groupType}
          />
        )}

        {!trip.isOwnRequest && trip.organizerName && (
          <p className="text-sm font-medium text-[var(--on-surface)]">
            Сборная группа · организатор: {trip.organizerName}
          </p>
        )}
        {shouldShowMeetingPoint(phase, trip.startsOn) && meetingPoint && (
          <p className="rounded-[14px] bg-[var(--brand-50)] px-3 py-2 text-sm font-medium text-[var(--primary)]">
            {meetingPoint}
          </p>
        )}
        {phase === "upcoming" &&
          trip.routeStops &&
          trip.routeStops.length >= 3 && (
            <>
              <div className="flex gap-2">
                {trip.routeStops.slice(0, 3).map((stop, i) => (
                  <Image
                    key={i}
                    unoptimized
                    src={stop.photoUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 rounded-[14px] object-cover"
                  />
                ))}
              </div>
              {trip.inclusions && (
                <p className="text-sm leading-6 text-[var(--on-surface-muted)]">
                  Что входит: {trip.inclusions.join(", ")}
                </p>
              )}
              {trip.guideName && (
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--on-surface)]">
                  {trip.guideAvatarUrl && (
                    <Image
                      unoptimized
                      src={trip.guideAvatarUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 rounded-full object-cover"
                    />
                  )}
                  <span>{trip.guideName}</span>
                </div>
              )}
              <span className="text-sm font-semibold text-[var(--primary)]">
                Написать гиду
              </span>
              {trip.price && (
                <p className="text-lg font-semibold text-[var(--on-surface)]">
                  {(trip.price.amount / 100).toLocaleString("ru-RU")} ₽
                </p>
              )}
            </>
          )}
        {phase === "completed" &&
          (trip.hasReview ? (
            <p className="text-sm font-medium text-[var(--on-surface)]">
              Ваш отзыв · ★ {trip.reviewRating}
            </p>
          ) : (
            <span className="text-sm font-semibold text-[var(--primary)]">
              Оставить отзыв
            </span>
          ))}

        <div className="flex items-center justify-between border-t border-[var(--outline)] pt-4">
          <span className="text-sm font-semibold text-[var(--primary)]">
            {actionLabel}
          </span>
        </div>
      </div>
    </>
  );
}

export function TripCard({
  phase,
  trip,
}: {
  phase: TripPhase;
  trip: TripCardModel;
}) {
  const isRequestBacked =
    phase === "waiting_offers" || phase === "awaiting_decision";

  const cardClassName =
    "block cursor-pointer rounded-[var(--card-radius)] border border-[var(--outline)] bg-[var(--surface-lowest)] p-5 shadow-[var(--card-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--lift-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2";

  if (isRequestBacked) {
    const hasUnread = (trip.unreadOfferCount ?? 0) > 0;
    return (
      <Link
        href={`/requests/${trip.id}`}
        className={cn(cardClassName, hasUnread && "border-l-4 border-l-[var(--primary)]")}
      >
        <article className="space-y-4">
          <TripCardContent phase={phase} trip={trip} />
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/bookings/${trip.id}`} className={cardClassName}>
      <article className="space-y-4">
        <TripCardContent phase={phase} trip={trip} />
      </article>
    </Link>
  );
}

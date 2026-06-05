import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { TripCardModel, TripPhase } from "./trip-card-types";

const BADGE_CLASS = "normal-case tracking-normal text-xs font-medium";

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
      <div className="grid grid-cols-3 gap-1">
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
              <div className="h-full w-full bg-muted" />
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
      className="aspect-video w-full object-cover"
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
    <div className="flex flex-wrap gap-1.5">
      {groupType ? (
        <span
          className={
            groupType === "assembly"
              ? "rounded-full border border-primary/40 px-2 py-0.5 text-xs font-medium text-primary"
              : "rounded-full border border-border px-2 py-0.5 text-xs font-medium text-ink-2"
          }
        >
          {groupType === "assembly" ? "Сборная группа" : "Своя группа"}
        </span>
      ) : null}
      {openToJoin ? (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          + к группе
        </span>
      ) : null}
      {datesFlexible ? (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
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
        <p className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
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
      <Badge variant="outline" className={BADGE_CLASS}>
        <CalendarDays className="size-3.5" />
        {formatDateRange(trip.startsOn, trip.endsOn)}
      </Badge>
      {trip.startTime ? (
        <Badge variant="outline" className={BADGE_CLASS}>
          <Clock className="size-3.5" />
          {formatTimeLabel(trip.startTime)}
        </Badge>
      ) : null}
      {shouldShowParticipants ? (
        <Badge variant="outline" className={BADGE_CLASS}>
          <Users className="size-3.5" />
          {formatPeople(participantsCount)}
        </Badge>
      ) : null}
      {budgetRub != null ? (
        <Badge
          variant="outline"
          className={cn(
            BADGE_CLASS,
            "border-success/30 bg-success/10 text-success",
          )}
        >
          <Wallet className="size-3.5" />
          {formatRub(budgetRub)}
        </Badge>
      ) : null}
    </div>
  );
}

function OfferCount({ count }: { count?: number }) {
  if (!count || count <= 0) return null;

  return <p className="text-sm text-muted-foreground">{count} откликов</p>;
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

  return (
    <>
      <TripPhoto phase={phase} trip={trip} />
      <h3 className="text-lg font-medium">{trip.destination}</h3>
      {isRequestBacked ? (
        <>
          <RequestFacts trip={trip} />
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
        <p className="text-sm">
          Сборная группа · организатор: {trip.organizerName}
        </p>
      )}
      {shouldShowMeetingPoint(phase, trip.startsOn) && meetingPoint && (
        <p className="text-sm">{meetingPoint}</p>
      )}
      {phase === "upcoming" &&
        trip.routeStops &&
        trip.routeStops.length >= 3 && (
          <>
            <div className="flex gap-1">
              {trip.routeStops.slice(0, 3).map((stop, i) => (
                <Image
                  key={i}
                  unoptimized
                  src={stop.photoUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="size-12 rounded object-cover"
                />
              ))}
            </div>
            {trip.inclusions && (
              <p className="text-sm">
                Что входит: {trip.inclusions.join(", ")}
              </p>
            )}
            {trip.guideName && (
              <div className="flex items-center gap-2">
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
            <span className="text-sm font-medium text-primary">Написать гиду</span>
            {trip.price && (
              <p>{(trip.price.amount / 100).toLocaleString("ru-RU")} ₽</p>
            )}
          </>
        )}
      {phase === "completed" &&
        (trip.hasReview ? (
          <p>Ваш отзыв · ★ {trip.reviewRating}</p>
        ) : (
          <span className="text-sm font-medium text-primary">Оставить отзыв</span>
        ))}
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
    "block cursor-pointer rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  if (isRequestBacked) {
    return (
      <Link href={`/traveler/requests/${trip.id}`} className={cardClassName}>
        <article className="space-y-3">
          <TripCardContent phase={phase} trip={trip} />
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/traveler/bookings/${trip.id}`} className={cardClassName}>
      <article className="space-y-3">
        <TripCardContent phase={phase} trip={trip} />
      </article>
    </Link>
  );
}

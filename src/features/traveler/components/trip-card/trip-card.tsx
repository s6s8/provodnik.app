import Image from "next/image";

import type { TripCardModel, TripPhase } from "./trip-card-types";

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
}: {
  openToJoin?: boolean;
  datesFlexible?: boolean;
}) {
  if (!openToJoin && !datesFlexible) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
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

export function TripCard({
  phase,
  trip,
}: {
  phase: TripPhase;
  trip: TripCardModel;
}) {
  const meetingPoint = trip.routeStops?.[0]?.address;

  return (
    <article className="rounded-lg border bg-card p-4">
      <TripPhoto phase={phase} trip={trip} />
      <h3 className="text-lg font-medium">{trip.destination}</h3>
      <FlexPills
        openToJoin={trip.openToJoin}
        datesFlexible={trip.datesFlexible}
      />
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
            <button type="button">Написать гиду</button>
            {trip.price && (
              <p>{(trip.price.amount / 100).toLocaleString("ru-RU")} ₽</p>
            )}
          </>
        )}
      {phase === "completed" &&
        (trip.hasReview ? (
          <p>Ваш отзыв · ★ {trip.reviewRating}</p>
        ) : (
          <button type="button">Оставить отзыв</button>
        ))}
    </article>
  );
}

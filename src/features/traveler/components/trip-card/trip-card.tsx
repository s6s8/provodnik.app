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
    if (!trip.destinationCityPhotoUrl) {
      return (
        <div
          data-testid="photo-fallback"
          className="flex aspect-video items-center justify-center bg-muted"
        >
          <span className="text-muted-foreground">фото скоро</span>
        </div>
      );
    }

    return (
      <Image
        unoptimized
        src={trip.destinationCityPhotoUrl}
        alt={trip.destination}
        width={1200}
        height={675}
        className="aspect-video w-full object-cover"
      />
    );
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
      {shouldShowMeetingPoint(phase, trip.startsOn) && meetingPoint && (
        <p className="text-sm">{meetingPoint}</p>
      )}
    </article>
  );
}

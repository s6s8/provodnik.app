import type { TripCardModel, TripPhase } from "./trip-card-types";

export function TripCard({
  phase: _phase,
  trip,
}: {
  phase: TripPhase;
  trip: TripCardModel;
}) {
  return (
    <article className="rounded-lg border bg-card p-4">
      <h3 className="text-lg font-medium">{trip.destination}</h3>
      {/* phase-specific rendering added in subsequent tasks */}
    </article>
  );
}

"use client";

import { useState } from "react";

import { TripCard } from "../trip-card/trip-card";
import type { TripCardModel, TripPhase } from "../trip-card/trip-card-types";

const PHASE_LIMITS: Record<TripPhase, number | "all"> = {
  today: "all",
  upcoming: 5,
  awaiting_decision: "all",
  waiting_offers: 3,
  completed: 0,
};

export function CabinetSection({
  phase,
  label,
  trips,
}: {
  phase: TripPhase;
  label: string;
  trips: TripCardModel[];
}) {
  const [expanded, setExpanded] = useState(false);
  const limit = PHASE_LIMITS[phase];
  const isCollapsedCompleted = phase === "completed" && !expanded;
  const isCapped =
    typeof limit === "number" && limit > 0 && trips.length > limit;
  const visible = isCollapsedCompleted
    ? []
    : isCapped && !expanded
      ? trips.slice(0, limit)
      : trips;

  const headerClickable = phase === "completed";

  return (
    <section className="flex flex-col gap-3">
      <h2
        className={
          "text-sm font-semibold uppercase tracking-wide text-muted-foreground" +
          (headerClickable ? " cursor-pointer" : "")
        }
        onClick={
          headerClickable ? () => setExpanded((prev) => !prev) : undefined
        }
      >
        {label} · {trips.length}
      </h2>
      <div className="grid gap-3" data-testid="trips-grid">
        {visible.map((trip) => (
          <div key={trip.id} data-testid="trip-card">
            <TripCard phase={phase} trip={trip} />
          </div>
        ))}
      </div>
      {isCapped && !expanded && (
        <button
          type="button"
          className="mt-2 text-sm underline"
          onClick={() => setExpanded(true)}
        >
          Показать все {trips.length}
        </button>
      )}
    </section>
  );
}

"use client";

import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

/**
 * A one-time coaching callout for the guide Excursions/Photobank first-use journey
 * (item 4). Dismissal persists in localStorage so it never spams on repeat visits.
 * ponytail: localStorage over a DB flag — a tooltip-seen bit does not need to travel
 * across devices, and this adds no schema, no server round-trip.
 */
export function CoachCallout({
  storageKey,
  children,
  show = true,
}: {
  storageKey: string;
  children: ReactNode;
  show?: boolean;
}) {
  // Start hidden so SSR and the first client paint agree; reveal after reading storage.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (dismissed || !show) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Private mode / storage disabled: hide for this session anyway.
    }
    setDismissed(true);
  }

  return (
    <div
      role="note"
      className="relative mb-4 rounded-card border border-primary/30 bg-primary/5 px-4 py-3 pr-10 text-sm text-foreground"
    >
      {children}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Понятно, скрыть подсказку"
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

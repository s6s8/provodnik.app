import {
  TransportOptionPill,
  type TransportOption,
} from "@/components/shared/transport-option-pill";
import { cn } from "@/lib/utils";

export function ItineraryTravelSegment({
  minutes,
  label,
  options,
  className,
}: {
  minutes: number;
  label?: string;
  options?: TransportOption[];
  className?: string;
}) {
  const timePart = label ?? `${minutes} мин`;

  return (
    <div
      className={cn(
        "relative ml-3 flex flex-wrap items-center gap-2 py-2 pl-4 text-xs text-white/50",
        "before:pointer-events-none before:absolute before:bottom-1/2 before:left-0 before:top-0 before:border-l before:border-white/10",
        "after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:top-1/2 after:border-l after:border-white/10",
        className,
      )}
    >
      <span className="shrink-0" aria-hidden>
        ↕
      </span>
      <span className="shrink-0">{timePart}</span>
      {options?.length ? (
        <>
          <span className="text-white/30" aria-hidden>
            ·
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {options.map((opt) => (
              <TransportOptionPill key={opt} transport={opt} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

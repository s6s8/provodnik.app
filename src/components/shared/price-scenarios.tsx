import { cn } from "@/lib/utils";
import type { PublicListingPriceScenario } from "@/data/public-listings/types";

function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PriceScenarios({
  scenarios,
  className,
}: {
  scenarios: readonly PublicListingPriceScenario[];
  className?: string;
}) {
  if (scenarios.length === 0) return null;

  return (
    <div className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {scenarios.map((scenario) => (
        <div
          key={scenario.id}
          className="rounded-2xl border border-border/70 bg-background/70 p-3"
        >
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {scenario.label}
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
            {formatRub(scenario.perPersonRub)} / человек
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatRub(scenario.totalRub)} за группу до {scenario.partySize}
          </p>
          {scenario.note ? (
            <p className="mt-2 text-sm text-muted-foreground">{scenario.note}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

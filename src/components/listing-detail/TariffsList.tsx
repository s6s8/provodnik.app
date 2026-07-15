import { formatRubNumber } from "@/data/money";
import type { ListingRow, ListingTariffRow } from "@/lib/supabase/types";

import { formatExcursionPriceFrom } from "./excursion-price";

function formatRub(minor: number): string {
  return formatRubNumber(Math.round(minor / 100));
}

function groupLabel(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min}–${max}`;
  if (min != null) return `от ${min}`;
  if (max != null) return `до ${max}`;
  return "—";
}

export function TariffsList({
  tariffs,
  priceFromMinor,
  defaultCurrency,
  format,
  maxGroupSize,
}: {
  tariffs: ListingTariffRow[];
  priceFromMinor: number;
  defaultCurrency: string;
  format?: ListingRow["format"];
  maxGroupSize?: number | null;
}) {
  if (tariffs.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <p className="text-2xl font-semibold">
          {formatExcursionPriceFrom(priceFromMinor, format, maxGroupSize)}
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold tracking-tight">Тарифы</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-3 py-2 font-medium">Тариф</th>
              <th className="px-3 py-2 font-medium">Цена</th>
              <th className="px-3 py-2 font-medium">Группа</th>
            </tr>
          </thead>
          <tbody>
            {tariffs.map((t) => {
              const cur = t.currency ?? defaultCurrency;
              // RUB rows share the card/detail wording (за группу до N / за одного),
              // scoped to this tier's own max_persons. Other currencies keep the
              // bare "<amount> <code>" — the shared formatter always emits ₽.
              const price =
                cur === "RUB"
                  ? formatExcursionPriceFrom(t.price_minor, format, t.max_persons)
                  : `${formatRub(t.price_minor)} ${cur}`;
              return (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{t.label}</td>
                  <td className="px-3 py-2">{price}</td>
                  <td className="px-3 py-2">{groupLabel(t.min_persons, t.max_persons)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

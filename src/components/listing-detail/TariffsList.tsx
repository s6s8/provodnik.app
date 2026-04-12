import type { ListingTariffRow } from "@/lib/supabase/types";

function formatRub(minor: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(minor / 100));
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
}: {
  tariffs: ListingTariffRow[];
  priceFromMinor: number;
  defaultCurrency: string;
}) {
  if (tariffs.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Стоимость</h2>
        <p className="text-2xl font-semibold">от {formatRub(priceFromMinor)} ₽</p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
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
              return (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{t.label}</td>
                  <td className="px-3 py-2">
                    {formatRub(t.price_minor)} {cur === "RUB" ? "₽" : cur}
                  </td>
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

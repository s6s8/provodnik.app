import { cn } from "@/lib/utils";

function formatRub(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n);
}

export function PriceScenarioCard({
  scenarios,
  currentGroupSize,
  className,
}: {
  scenarios: Array<{ groupSize: number; pricePerPersonRub: number }>;
  currentGroupSize: number;
  className?: string;
}) {
  const prices = scenarios.map((s) => s.pricePerPersonRub);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const rows = [...scenarios].sort((a, b) => a.groupSize - b.groupSize);

  return (
    <section
      className={cn(
        "glass-panel rounded-[1.5rem] border border-white/10 p-5",
        className,
      )}
    >
      <h3 className="text-base font-semibold text-white/90">
        Как цена зависит от группы
      </h3>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-white/50">
              <th className="px-4 py-2.5 font-semibold">Размер группы</th>
              <th className="px-4 py-2.5 font-semibold">Цена за человека</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const active = row.groupSize === currentGroupSize;
              return (
                <tr
                  key={row.groupSize}
                  className={cn(
                    "border-b border-white/10 last:border-b-0",
                    active ? "bg-white/6" : "bg-transparent",
                  )}
                >
                  <td
                    className={cn(
                      "px-4 py-2.5",
                      active ? "text-primary font-medium" : "text-white/80",
                    )}
                  >
                    {row.groupSize}{" "}
                    {row.groupSize === 1
                      ? "человек"
                      : row.groupSize >= 2 && row.groupSize <= 4
                        ? "человека"
                        : "человек"}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5",
                      active ? "text-primary font-medium" : "text-white/80",
                    )}
                  >
                    {formatRub(row.pricePerPersonRub)} ₽
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-white/50">
        При бронировании вы соглашаетесь на диапазон от{" "}
        <span className="text-white/70">{formatRub(minPrice)}</span> до{" "}
        <span className="text-white/70">{formatRub(maxPrice)}</span> ₽ на случай
        изменения состава
      </p>
    </section>
  );
}

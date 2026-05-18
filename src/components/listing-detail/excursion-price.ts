import type { ListingRow } from "@/lib/supabase/types";

// "от X ₽" with a per-format scope suffix so the price is never ambiguous:
//   private     → the price covers the whole (closed) group
//   group/combo → the price is per person
//   unknown     → no suffix
export function formatExcursionPriceFrom(
  priceFromMinor: number,
  format: ListingRow["format"],
): string {
  const rub = new Intl.NumberFormat("ru-RU").format(Math.round(priceFromMinor / 100));
  const base = `от ${rub} ₽`;
  if (format === "private") return `${base} за группу`;
  if (format === "group" || format === "combo") return `${base} за одного`;
  return base;
}

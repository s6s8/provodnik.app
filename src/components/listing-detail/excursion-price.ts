import { formatRubNumber } from "@/data/money";

// "от X ₽" with a per-format scope suffix so the price is never ambiguous:
//   private     → the price covers the whole (closed) group, up to N people
//   group/combo → the price is per person
//   unknown     → no suffix
// `format` is widened to `string` so card records (whose `format` is typed
// `string`) share this one formatter instead of a card-only copy; any value
// outside the known enum falls through to the bare "от X ₽".
export function formatExcursionPriceFrom(
  priceFromMinor: number,
  format: string | null | undefined,
  maxGroupSize?: number | null,
): string {
  const rub = formatRubNumber(Math.round(priceFromMinor / 100));
  const base = `от ${rub} ₽`;
  if (format === "private") {
    const cap = maxGroupSize && maxGroupSize > 0 ? ` до ${maxGroupSize} человек` : "";
    return `${base} за группу${cap}`;
  }
  if (format === "group" || format === "combo") return `${base} за одного`;
  return base;
}

const DEFAULT_DESTINATION_LABEL = "Маршрут";

const LEAKED_ATTRIBUTE_RE = /(^|[\s,;])(?:placeholder|aria-autocomplete|autocomplete)\s*=/i;
const DUPLICATED_WORD_RE = /(^|[^\p{L}])(\p{L}{2,})\2(?=$|[^\p{L}])/gu;

/** Shared destination length bounds — client input cap, Zod, and DB column agree. */
export const DESTINATION_MIN_LENGTH = 2;
export const DESTINATION_MAX_LENGTH = 80;

// A place name a human types: a leading letter, then letters/marks, whitespace and
// the punctuation real toponyms use — hyphen, dashes, apostrophes, period, comma,
// parentheses, ellipsis. No digits, no ASCII symbols (! # _ / = …). This is the
// canonical destination shape check. It is wired into the traveler-request Zod
// schema, which both the client resolver and the server action parse — so every
// create path (and therefore every stored destination) is gated by it. It accepts
// unlisted but real destinations ("Шанхай", "Санкт-Петербург", "Ростов-на-Дону")
// and rejects symbol/number garbage ("!!!###garbage_XYZ_ноль123") without shrinking
// the field to a fixed allow-list.
const SUPPORTED_DESTINATION_RE = /^\p{L}[\p{L}\p{M}\s.,'’()…–—-]*$/u;

/**
 * True when a (already-sanitized) label reads as a real place name. Used by the
 * traveler-request schema so the same rule holds on the client resolver, the
 * server action, and anything that persists a destination.
 */
export function isSupportedDestinationLabel(value: string): boolean {
  const label = value.trim();
  if (label.length < DESTINATION_MIN_LENGTH || label.length > DESTINATION_MAX_LENGTH) {
    return false;
  }
  if (!SUPPORTED_DESTINATION_RE.test(label)) return false;
  // Guard the degenerate "single letter repeated" case (e.g. 80×"Ё"): every real
  // toponym has at least two distinct letters, garbage padding does not.
  const distinctLetters = new Set(
    (label.match(/\p{L}/gu) ?? []).map((ch) => ch.toLocaleLowerCase("ru")),
  );
  return distinctLetters.size >= 2;
}

export function sanitizeTravelerRequestDestinationLabel(
  value: unknown,
  options: { fallback?: boolean } = {},
): string {
  const fallback = options.fallback ?? true;
  let label = typeof value === "string" ? value.trim() : "";

  const leakedAttribute = label.search(LEAKED_ATTRIBUTE_RE);
  if (leakedAttribute !== -1) {
    label = label.slice(0, leakedAttribute);
  }

  label = label
    .replace(DUPLICATED_WORD_RE, "$1$2")
    .replace(/\s*,\s*/g, ", ")
    .replace(/(?:,\s*){2,}/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/^[\s,]+|[\s,]+$/g, "");

  return label || (fallback ? DEFAULT_DESTINATION_LABEL : "");
}

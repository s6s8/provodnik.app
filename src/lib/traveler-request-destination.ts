const DEFAULT_DESTINATION_LABEL = "Маршрут";

const LEAKED_ATTRIBUTE_RE = /(^|[\s,;])(?:placeholder|aria-autocomplete|autocomplete)\s*=/i;
const DUPLICATED_WORD_RE = /(^|[^\p{L}])(\p{L}{2,})\2(?=$|[^\p{L}])/gu;

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

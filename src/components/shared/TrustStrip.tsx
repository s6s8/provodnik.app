import { cn } from "@/lib/utils";

/**
 * Trust signals strip rendered under the homepage form CTA.
 *
 * Hardcoded trust item in Russian (no i18n yet — Phase A is ru-only).
 * The item is preceded by a checkmark glyph. Visually compact.
 */
const ITEMS = [
  "Гиды проверены",
] as const;

export default function TrustStrip({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
      aria-label="Гарантии платформы"
    >
      {ITEMS.map((item) => (
        <li key={item} className="flex items-center gap-1">
          <span aria-hidden="true" className="text-primary">
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

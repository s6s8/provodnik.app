import { cn } from "@/lib/utils";

type ScrimProps = {
  /** "card" = subtle top + strong bottom (photo cards); "hero" = full-bleed hero. */
  variant?: "card" | "hero";
  className?: string;
};

/**
 * Image legibility overlay. The gradient recipes live in globals.css
 * (`.scrim` / `.scrim-hero`) — components never inline rgba() gradients.
 */
export function Scrim({ variant = "card", className }: ScrimProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0", variant === "hero" ? "scrim-hero" : "scrim", className)}
    />
  );
}

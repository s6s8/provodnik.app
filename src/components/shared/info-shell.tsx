import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type InfoPageShellProps = {
  children: ReactNode;
  /** "prose" = readable single column (default); "wide" = roomier help/FAQ column. */
  width?: "prose" | "wide";
  className?: string;
};

/**
 * Info/conversion-family page container. One width + one vertical rhythm for
 * the text-led pages (`/how-it-works`, `/become-a-guide`, `/trust`, `/help`)
 * so they read as one product, not four bespoke documents.
 */
export function InfoPageShell({ children, width = "prose", className }: InfoPageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-gutter py-16",
        width === "wide" ? "max-w-3xl" : "max-w-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

type InfoHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Primary/secondary CTAs rendered under the subtitle. */
  actions?: ReactNode;
  className?: string;
};

/**
 * Info/conversion-family hero — a compact, user-first text hero (no decorative
 * full-bleed photo). Shared by every info page so the opening rhythm matches.
 */
export function InfoHero({ eyebrow, title, subtitle, actions, className }: InfoHeroProps) {
  return (
    <header className={cn("mb-12", className)}>
      {eyebrow ? (
        <Badge variant="eyebrow" className="mb-3">
          {eyebrow}
        </Badge>
      ) : null}
      <h1 className="text-[clamp(28px,4vw,38px)] font-bold leading-[1.1] tracking-[-0.03em] text-on-surface">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 max-w-[60ch] text-[15px] leading-[1.55] text-on-surface-muted">
          {subtitle}
        </p>
      ) : null}
      {actions ? <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}

type InfoSectionProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Info/conversion-family section block — an optional section heading + body,
 * with the shared spacing between sections.
 */
export function InfoSection({ title, children, className }: InfoSectionProps) {
  return (
    <section className={cn("mb-12", className)}>
      {title ? (
        <h2 className="mb-6 text-section font-extrabold tracking-tight text-foreground">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

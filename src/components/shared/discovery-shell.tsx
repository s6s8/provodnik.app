import type { ReactNode } from "react";

import { ListHero } from "@/components/shared/list-hero";
import { cn } from "@/lib/utils";
import { pluralize } from "@/lib/utils";

type DiscoveryHeroProps = {
  imageUrl: string;
  /** Object-position of the background photo, e.g. "center 45%". */
  imagePosition?: string;
  title: string;
  intro?: string;
  /** Search / intent control rendered under the title. */
  children?: ReactNode;
};

/**
 * Discovery-family hero. A thin wrapper over the canonical full-bleed
 * {@link ListHero} so every discovery page (`/requests`, `/listings`,
 * `/guides`, `/destinations`) opens with the same compact photo hero +
 * search/intent slot rhythm. Keep page intent in the copy, not the layout.
 */
export function DiscoveryHero({
  imageUrl,
  imagePosition,
  title,
  intro,
  children,
}: DiscoveryHeroProps) {
  return (
    <ListHero imageUrl={imageUrl} imagePosition={imagePosition} title={title} intro={intro}>
      {children}
    </ListHero>
  );
}

type DiscoveryShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Discovery-family content container. One width (`max-w-page`), one fluid
 * gutter, one top/bottom rhythm — so the body of every discovery page sits in
 * the same column under the hero.
 */
export function DiscoveryShell({ children, className }: DiscoveryShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-page space-y-8 px-[clamp(20px,4vw,48px)] pb-20 pt-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

type DiscoveryFilterBarProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Discovery-family filter band — a tinted full-width strip that holds the
 * page's filter/intent controls and keeps them on the same surface + column
 * as the rest of the family.
 */
export function DiscoveryFilterBar({ children, className }: DiscoveryFilterBarProps) {
  return (
    <section className={cn("bg-surface-low py-6", className)}>
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">{children}</div>
    </section>
  );
}

type DiscoveryGridProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Discovery-family results grid — 1 column on mobile, 2 on tablet, 3 on
 * desktop, with the shared gap rhythm. Card internals stay page-specific; only
 * the outer grid is unified.
 */
export function DiscoveryGrid({ children, className }: DiscoveryGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {children}
    </div>
  );
}

type DiscoveryResultsCountProps = {
  count: number;
  /** Russian plural forms: [one, few, many] — e.g. ["гид", "гида", "гидов"]. */
  noun: readonly [string, string, string];
  className?: string;
};

/**
 * Discovery-family results line — "Найдено N …" with correct Russian
 * pluralisation. Render where a result count helps the user orient.
 */
export function DiscoveryResultsCount({ count, noun, className }: DiscoveryResultsCountProps) {
  return (
    <p className={cn("text-sm text-on-surface-muted", className)}>
      Найдено {count} {pluralize(count, noun[0], noun[1], noun[2])}
    </p>
  );
}

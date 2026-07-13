import type { ComponentType, ReactNode, SVGProps } from "react";
import { X } from "lucide-react";

import { ListHero } from "@/components/shared/list-hero";
import { Badge } from "@/components/ui/badge";
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
        "mx-auto w-full max-w-page flex flex-col gap-8 px-[clamp(20px,4vw,48px)] pb-20 pt-10",
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

type DiscoveryToolbarProps = {
  /** Row 1 — the facet rail (use {@link DiscoveryFacetRail}). */
  facets: ReactNode;
  /** Row 2, left — usually a {@link DiscoveryResultsCount}. */
  count?: ReactNode;
  /** Row 2, right — advanced-filter trigger / sort controls. */
  actions?: ReactNode;
  /** Optional row — removable active filters (use {@link DiscoveryActiveFilters}). */
  activeFilters?: ReactNode;
  className?: string;
};

/**
 * Discovery-family toolbar — the one tinted band that sits between the hero and
 * the grid on every discovery page. It owns the chrome (surface, column, row
 * rhythm); pages own which facets/filters live inside it. Replaces the ad-hoc
 * per-page filter clusters so `/requests`, `/listings`, `/guides` and
 * `/destinations` share identical toolbar geometry.
 */
export function DiscoveryToolbar({
  facets,
  count,
  actions,
  activeFilters,
  className,
}: DiscoveryToolbarProps) {
  return (
    <section className={cn("bg-surface-low", className)}>
      <div className="mx-auto w-full max-w-page flex flex-col gap-3 px-[clamp(20px,4vw,48px)] py-5">
        {facets}
        {count || actions ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">{count}</div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
        ) : null}
        {activeFilters}
      </div>
    </section>
  );
}

type DiscoveryFacetRailProps = {
  children: ReactNode;
  /** Accessible group label, e.g. "Категории". */
  label: string;
  className?: string;
};

/**
 * Discovery-family facet rail — a single horizontal scroll-snap strip that holds
 * {@link DiscoveryFacetChip}s. One behaviour on desktop and mobile: it scrolls
 * horizontally and never wraps or stacks. Native CSS scroll-snap, no JS carousel.
 */
export function DiscoveryFacetRail({ children, label, className }: DiscoveryFacetRailProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex snap-x gap-2 overflow-x-auto pb-1 pr-6 [-ms-overflow-style:none] [mask-image:linear-gradient(to_right,#000_calc(100%-1.5rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        // From md up the rail has room to wrap: no clipped last pill, no fade.
        "md:flex-wrap md:overflow-visible md:pr-0 md:[mask-image:none]",
        className,
      )}
    >
      {children}
    </div>
  );
}

type DiscoveryFacetChipProps = {
  children: ReactNode;
  onClick: () => void;
  /** Visually + semantically selected. */
  active?: boolean;
  /** When set, exposes toggle semantics via `aria-pressed`. */
  pressed?: boolean;
  /** Optional non-negative facet count rendered after the label. */
  count?: number;
  /** Optional leading icon (lucide component). */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  className?: string;
};

/**
 * Discovery-family facet chip — THE canonical chip for every discovery rail.
 * One height, one radius, one active colour across all four pages. Pages pass
 * label + handler + optional count/icon; they never hand-roll chip markup.
 */
export function DiscoveryFacetChip({
  children,
  onClick,
  active = false,
  pressed,
  count,
  icon: Icon,
  className,
}: DiscoveryFacetChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...(pressed === undefined ? {} : { "aria-pressed": pressed })}
      className={cn(
        "inline-flex h-11 shrink-0 cursor-pointer snap-start items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
        "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-on-surface hover:bg-surface-high",
        className,
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
      {children}
      {typeof count === "number" ? (
        <span className="tabular-nums opacity-60">{count}</span>
      ) : null}
    </button>
  );
}

type DiscoveryActiveFilter = {
  /** Stable React key. */
  key: string;
  /** Human label shown in the badge. */
  label: string;
  /** Remove just this filter. */
  onRemove: () => void;
};

type DiscoveryActiveFiltersProps = {
  filters: readonly DiscoveryActiveFilter[];
  /** Clear every active filter at once. */
  onReset: () => void;
  className?: string;
};

/**
 * Discovery-family active-filter row — removable outline badges plus a single
 * "Сбросить всё". The one reset model for the whole family. Renders nothing when
 * no filters are active.
 */
export function DiscoveryActiveFilters({
  filters,
  onReset,
  className,
}: DiscoveryActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {filters.map((filter) => (
        <Badge key={filter.key} variant="outline" className="gap-1 normal-case tracking-normal">
          {filter.label}
          <button
            type="button"
            onClick={filter.onRemove}
            aria-label={`Очистить ${filter.label}`}
            className="cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="cursor-pointer px-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        Сбросить всё
      </button>
    </div>
  );
}

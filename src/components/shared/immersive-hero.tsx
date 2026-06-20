import type { ReactNode } from "react";

import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type HeroBreadcrumbItem = { label: string };

type ImmersiveHeroProps = {
  imageUrl: string;
  /** Object-position of the background photo, e.g. "center 44%". */
  imagePosition?: string;
  breadcrumb?: readonly HeroBreadcrumbItem[];
  title: string;
  intro?: string;
  /** Bottom-right slot (the floating trip / booking panel). */
  children?: ReactNode;
  className?: string;
};

const HERO_GRADIENT =
  "linear-gradient(180deg,rgba(8,14,24,.5) 0%,rgba(8,14,24,.1) 22%,rgba(8,14,24,.14) 52%,rgba(8,14,24,.8) 100%)";

/**
 * Full-bleed hero: background photo + dark bottom gradient, a centered content
 * rail with a bottom-left title block and a bottom-right panel slot. Designed to
 * sit under a transparent overlay header. Canonical primitive for detail pages.
 */
export function ImmersiveHero({
  imageUrl,
  imagePosition = "center 44%",
  breadcrumb,
  title,
  intro,
  children,
  className,
}: ImmersiveHeroProps) {
  return (
    <section className={cn("relative w-full overflow-hidden", className)}>
      <div className="relative min-h-[480px] md:h-[560px]">
        <div
          className="absolute inset-0 bg-surface-low bg-cover"
          style={{ backgroundImage: `url('${imageUrl}')`, backgroundPosition: imagePosition }}
          role="img"
          aria-label={title}
        />
        <div className="absolute inset-0" style={{ backgroundImage: HERO_GRADIENT }} />

        <div className="relative z-[2] mx-auto flex h-full min-h-[480px] max-w-page flex-col justify-end gap-7 px-5 pb-10 md:min-h-0 md:px-8 md:pb-0">
          {/* Title block — bottom-left on desktop */}
          <div className="md:absolute md:bottom-12 md:left-8 md:max-w-[540px]">
            {breadcrumb && breadcrumb.length > 0 ? (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[12.5px] font-medium text-white/80">
                {breadcrumb.map((item, index) => (
                  <span key={`${item.label}-${index}`} className="flex items-center gap-2">
                    {index > 0 ? <ChevronRight className="size-3.5 opacity-50" /> : null}
                    <span>{item.label}</span>
                  </span>
                ))}
              </div>
            ) : null}
            <h1 className="mb-4 text-[clamp(2.75rem,8vw,68px)] font-bold leading-[0.98] tracking-[-0.04em] text-white">
              {title}
            </h1>
            {intro ? (
              <p className="max-w-[470px] text-[16.5px] leading-[1.5] text-white/90">{intro}</p>
            ) : null}
          </div>

          {/* Panel slot — bottom-right on desktop, full-width stacked on mobile */}
          {children ? (
            <div className="w-full md:absolute md:bottom-12 md:right-8 md:w-auto">{children}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

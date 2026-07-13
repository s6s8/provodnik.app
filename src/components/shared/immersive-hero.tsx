import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { ChevronRight } from "lucide-react";

import { Scrim } from "@/components/ui/scrim";
import { cn } from "@/lib/utils";

export type HeroBreadcrumbItem = {
  label: string;
  /** When set, the crumb renders as a link to this route. */
  href?: string;
  /** Marks the current page (non-clickable, announced via aria-current). */
  current?: boolean;
};

type ImmersiveHeroProps = {
  imageUrl: string;
  /** Object-position of the background photo, e.g. "center 44%". */
  imagePosition?: string;
  breadcrumb?: readonly HeroBreadcrumbItem[];
  title: string;
  intro?: string;
  /** Status pill / badge rendered in the overlay near the title block. */
  statusBadge?: ReactNode;
  /** Subtle film-grain overlay. Defaults to true. */
  grain?: boolean;
  /** Bottom-right slot (the floating trip / booking panel). */
  children?: ReactNode;
  className?: string;
};

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
  statusBadge,
  grain = true,
  children,
  className,
}: ImmersiveHeroProps) {
  // Real photos (http/local) load through next/image with priority so the hero
  // paints immediately on cold navigation instead of flashing the grey
  // placeholder while the browser fetches a CSS background-image. SVG-gradient
  // data URLs (brandGradient fallback) keep the lightweight CSS background.
  const isPhoto = /^(https?:|\/)/.test(imageUrl);
  return (
    <section className={cn("relative w-full overflow-hidden", className)}>
      <div className="relative min-h-[520px] sm:min-h-[632px]">
        {isPhoto ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 bg-surface-low object-cover"
            style={{ objectPosition: imagePosition }}
          />
        ) : (
          <div
            className="absolute inset-0 bg-surface-low bg-cover bg-[image:var(--hero-img)] bg-[position:var(--hero-pos)]"
            style={{
              ["--hero-img" as string]: `url('${imageUrl}')`,
              ["--hero-pos" as string]: imagePosition,
            }}
            role="img"
            aria-label={title}
          />
        )}
        <Scrim variant="hero" />
        {grain ? <div className="hero-grain pointer-events-none absolute inset-0 z-[1]" /> : null}

        <div className="relative z-[2] mx-auto flex min-h-[520px] max-w-page flex-col justify-end gap-7 px-5 pb-10 pt-[calc(var(--nav-h)+16px)] sm:min-h-[632px] md:flex-row md:items-end md:justify-between md:gap-8 md:px-8 md:pb-12 md:pt-0">
          {/* Title block — bottom-left on desktop */}
          <div className="min-w-0 md:max-w-[540px]">
            {breadcrumb && breadcrumb.length > 0 ? (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[12.5px] font-medium text-white/80">
                {breadcrumb.map((item, index) => (
                  <span key={`${item.label}-${index}`} className="flex items-center gap-2">
                    {index > 0 ? <ChevronRight className="size-3.5 opacity-50" /> : null}
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span aria-current={item.current ? "page" : undefined}>
                        {item.label}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : null}
            {statusBadge ? <div className="mb-4">{statusBadge}</div> : null}
            <h1 className="mb-4 text-[clamp(46px,7vw,74px)] font-extrabold leading-[0.96] tracking-[-0.035em] text-white">
              {title}
            </h1>
            {intro ? (
              <p className="max-w-[470px] text-[16.5px] leading-[1.5] text-white/90">{intro}</p>
            ) : null}
          </div>

          {/* Panel slot — bottom-right on desktop, full-width stacked on mobile */}
          {children ? (
            <div className="w-full md:w-auto md:shrink-0">{children}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

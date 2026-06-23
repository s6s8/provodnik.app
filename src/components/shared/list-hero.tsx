import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ListHeroProps = {
  imageUrl: string;
  /** Object-position of the background photo, e.g. "center 45%". */
  imagePosition?: string;
  title: string;
  intro?: string;
  /** Search / filter control rendered under the title. */
  children?: ReactNode;
  className?: string;
};

/**
 * Compact full-bleed hero for catalog/list pages: photo + canon scrim + centered
 * title + a search slot. Bleeds to the very top of the viewport under the floating
 * overlay header — the same `-mt-nav-h` breakout the canon ImmersiveHero uses — so
 * there is no dead nav-gap above the photo.
 */
export function ListHero({
  imageUrl,
  imagePosition = "center 45%",
  title,
  intro,
  children,
  className,
}: ListHeroProps) {
  return (
    <section className={cn("relative -mt-nav-h w-full overflow-hidden", className)}>
      <div
        className="absolute inset-0 bg-surface-low bg-cover"
        style={{ backgroundImage: `url('${imageUrl}')`, backgroundPosition: imagePosition }}
        role="img"
        aria-label={title}
      />
      <div className="hero-overlay absolute inset-0" />

      <div className="relative z-[2] mx-auto flex min-h-[380px] w-full max-w-page flex-col justify-center gap-5 px-5 pt-nav-h md:min-h-[420px] md:px-8">
        <h1 className="text-[clamp(2rem,5vw,44px)] font-bold leading-[1.05] tracking-[-0.03em] text-white">
          {title}
        </h1>
        {intro ? (
          <p className="max-w-[560px] text-[15.5px] leading-[1.5] text-white/90">{intro}</p>
        ) : null}
        {children ? <div className="w-full max-w-[680px]">{children}</div> : null}
      </div>
    </section>
  );
}

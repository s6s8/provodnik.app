import Image from "next/image";
import { ArrowDown } from "lucide-react";

import { Scrim } from "@/components/ui/scrim";
import type { DestinationOption } from "@/data/supabase/queries";

import { HomepageRequestFormClassic } from "./homepage-request-form-classic";

// Served from /public (version-controlled) instead of a Supabase Storage object
// that returned HTTP 400 because it was never uploaded. Swap for a branded
// /hero-provodnik.png once that asset is committed.
const HERO_IMAGE = "/hero-valley.jpg";

interface Props {
  destinations: DestinationOption[];
  preferredGuide?: { slug: string; name: string } | null;
  /** True when the page below actually renders the #groups section. */
  hasGroups?: boolean;
}

export function HomepageHeroFormClassic({ destinations, preferredGuide, hasGroups = false }: Props) {
  return (
    // Sized by its content, not by the viewport. `min-h-svh` was a FLOOR, not a
    // cap: stacked with the padding below it made the first screen taller than the
    // viewport on desktop, so nothing below ever peeked and the «Сборные группы»
    // affordance (pinned to the section's bottom) sat under the fold — the one
    // thing it exists to prevent. The floor here only keeps the hero from
    // collapsing on very short viewports; the form sets the real height.
    <section className="relative flex min-h-[34rem] flex-col overflow-hidden bg-gradient-to-b from-brand-800 to-brand-950">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_44%]"
      />
      <Scrim variant="hero" />

      {/*
        Both paddings are the smallest their constraint allows — every pixel here
        pushes the next section off screen. pt clears the header pill (which ends
        at 80px; the home route's <main> has no pt-nav-h). pb reserves the band the
        absolutely-positioned «Сборные группы» affordance occupies (54px tall at
        bottom-6 = 78px); go below that and it rides up over the form card.
      */}
      <div className="relative z-[2] flex flex-1 flex-col items-center justify-center px-gutter pb-24 pt-24 text-center">
        <h1 className="mb-7 font-display text-display font-extrabold leading-none tracking-tighter text-white">
          Куда отправимся?
        </h1>

        <div className="w-full max-w-lg rounded-hero bg-surface p-5 text-left shadow-lift">
          <HomepageRequestFormClassic destinations={destinations} preferredGuide={preferredGuide} />
        </div>
      </div>

      {hasGroups ? (
        <a
          href="#groups"
          className="absolute bottom-6 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-1.5 rounded-step px-3 py-2 text-xs font-semibold tracking-wider text-white drop-shadow-lg outline-none focus-visible:ring-3 focus-visible:ring-white/60"
        >
          <span>Сборные группы</span>
          <ArrowDown className="size-4 motion-safe:animate-bounce" aria-hidden="true" />
        </a>
      ) : null}
    </section>
  );
}

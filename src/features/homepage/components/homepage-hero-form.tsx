import type { DestinationOption } from "@/data/supabase/queries";

import { COMMISSION_PCT } from "@/config/commission";
import { HomepageRequestForm } from "./homepage-request-form";
import TrustStrip from "@/components/shared/TrustStrip";

interface Props {
  destinations: DestinationOption[];
}

export function HomepageHeroForm({ destinations }: Props) {
  return (
    <section className="py-16">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-3 text-center font-display text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] text-foreground">
            Частный гид — для вашей семьи или компании
          </h1>
          <p className="mb-8 text-center text-sm text-muted-foreground sm:text-base">
            Опишите запрос — местные гиды ответят за пару часов. Мы берём{" "}
            {COMMISSION_PCT}%, остальное идёт гиду напрямую.
          </p>
          <HomepageRequestForm destinations={destinations} />
          <TrustStrip className="mt-6" />
        </div>
      </div>
    </section>
  );
}

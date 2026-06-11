import type { DestinationOption } from "@/data/supabase/queries";

import { HomepageRequestFormClassic } from "./homepage-request-form-classic";

interface Props {
  destinations: DestinationOption[];
}

export function HomepageHeroFormClassic({ destinations }: Props) {
  return (
    <section className="py-16">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-center font-display text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15] text-foreground">
            Местный гид под ваш запрос
          </h1>
          <HomepageRequestFormClassic destinations={destinations} />
        </div>
      </div>
    </section>
  );
}

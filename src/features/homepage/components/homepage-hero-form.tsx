import type { DestinationOption } from "@/data/supabase/queries";

import { HomepageRequestForm } from "./homepage-request-form";

interface Props {
  destinations: DestinationOption[];
}

export function HomepageHeroForm({ destinations }: Props) {
  return (
    <section className="py-16">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.2] text-foreground">
            Опишите запрос — гиды откликнутся
          </h1>
          <HomepageRequestForm destinations={destinations} />
        </div>
      </div>
    </section>
  );
}

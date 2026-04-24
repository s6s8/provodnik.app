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
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Биржа экскурсий с местными гидами
          </p>
          <h1 className="mb-2 font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.2] text-foreground">
            Опишите, что ищете — гиды ответят за 24 часа
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Обычно 4–7 предложений в течение суток
          </p>
          <HomepageRequestForm destinations={destinations} />
        </div>
      </div>
    </section>
  );
}

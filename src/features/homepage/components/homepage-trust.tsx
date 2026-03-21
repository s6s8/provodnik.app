import { Percent, ScrollText, ShieldCheck } from "lucide-react";

import {
  type HomeTrustCard,
  homeContainerClass,
  homepageContent,
} from "@/features/homepage/components/homepage-content";
import { cn } from "@/lib/utils";

const trustIcons = {
  shield: ShieldCheck,
  scroll: ScrollText,
  percent: Percent,
} as const;

export function HomePageTrust() {
  return (
    <section className={cn(homeContainerClass, "pb-8 pt-2 sm:pb-10")}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {homepageContent.trust.cards.map((card) => (
          <TrustCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  );
}

function TrustCard({ card }: { card: HomeTrustCard }) {
  const Icon = trustIcons[card.icon];

  return (
    <article className="flex items-start gap-3 rounded-[20px] border border-[rgba(226,232,240,0.85)] bg-[rgba(255,255,255,0.55)] px-4 py-4 shadow-[0_10px_28px_rgba(33,49,63,0.05)] backdrop-blur-lg backdrop-saturate-150">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[rgba(15,118,110,0.1)] text-[var(--color-primary)] ring-1 ring-[rgba(15,118,110,0.08)]">
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <h3 className="text-[0.9375rem] font-semibold leading-snug text-[var(--color-text)]">
          {card.title}
        </h3>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--color-text-secondary)]">
          {card.description}
        </p>
      </div>
    </article>
  );
}

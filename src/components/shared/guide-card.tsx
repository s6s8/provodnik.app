import Image from "next/image";
import Link from "next/link";

import { GlassCard } from "@/components/shared/glass-card";
import { RatingDisplay } from "@/components/shared/rating-display";
import type { GuideRecord } from "@/data/supabase/queries";

type GuideCardProps = {
  guide: GuideRecord;
};

export function GuideCard({ guide }: GuideCardProps) {
  return (
    <Link href={`/guides/${guide.slug}`} className="block transition-transform hover:-translate-y-1">
      <GlassCard className="h-full p-6">
        <div className="flex items-start gap-4">
          {guide.avatarUrl ? (
            <div className="relative size-[4.5rem] overflow-hidden rounded-full">
              <Image src={guide.avatarUrl} alt={guide.fullName} fill sizes="72px" className="object-cover" />
            </div>
          ) : (
            <div className="flex size-[4.5rem] items-center justify-center rounded-full bg-[var(--brand-light)] font-display text-2xl font-semibold text-[var(--brand)]">
              {guide.initials}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <h3 className="text-2xl font-semibold leading-tight text-[var(--ink)]">{guide.fullName}</h3>
            <p className="text-sm text-[var(--ink-2)]">{guide.homeBase}</p>
            <RatingDisplay rating={guide.rating} reviewCount={guide.reviewCount} />
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-[var(--ink-2)]">{guide.bio}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {guide.destinations.slice(0, 3).map((destination) => (
            <span
              key={destination}
              className="rounded-full bg-[var(--surface-high)] px-3 py-1.5 text-xs font-medium text-[var(--ink-2)]"
            >
              {destination}
            </span>
          ))}
        </div>
      </GlassCard>
    </Link>
  );
}

import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingDisplay } from "@/components/shared/rating-display";
import { cn, pluralize } from "@/lib/utils";

export type PublicGuideCardProps = {
  slug: string;
  fullName: string;
  initials: string;
  avatarUrl?: string | null;
  homeBase?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  verified?: boolean;
  experienceYears?: number | null;
  specialties?: string[];
  tripsCompleted?: number | null;
  className?: string;
};

/** Non-selectable guide directory card — links to /guides/{slug}. Names + faces the guide. */
export function PublicGuideCard({
  slug,
  fullName,
  initials,
  avatarUrl,
  homeBase,
  rating,
  reviewCount,
  verified = false,
  experienceYears,
  specialties = [],
  tripsCompleted,
  className,
}: PublicGuideCardProps) {
  const showExperience = experienceYears != null && experienceYears > 0;
  const showTrips = tripsCompleted != null && tripsCompleted > 0;
  const visibleSpecialties = specialties.slice(0, 3);

  return (
    <Link
      href={`/guides/${slug}`}
      className={cn(
        "flex flex-col gap-3 rounded-[16px] border border-border bg-surface-lowest p-5 transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-14 shrink-0">
          <AvatarImage src={avatarUrl ?? undefined} alt={fullName} className="object-cover" />
          <AvatarFallback className="bg-surface-low font-semibold text-on-surface-muted">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[16px] font-semibold text-on-surface">{fullName}</span>
            {verified ? (
              <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-success">
                <BadgeCheck className="size-3.5" />
                Проверен
              </span>
            ) : null}
          </div>
          {homeBase ? (
            <span className="text-[13px] text-on-surface-muted">{homeBase}</span>
          ) : null}
          <RatingDisplay rating={rating} reviewCount={reviewCount} verified={verified} />
        </div>
      </div>

      {showExperience || showTrips ? (
        <div className="text-[13px] text-on-surface-muted">
          {[
            showExperience
              ? `${experienceYears} ${pluralize(experienceYears!, "год", "года", "лет")} опыта`
              : null,
            showTrips
              ? `${tripsCompleted} ${pluralize(tripsCompleted!, "поездка", "поездки", "поездок")}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      ) : null}

      {visibleSpecialties.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {visibleSpecialties.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-low px-2.5 py-0.5 text-[12px] text-ink-2"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

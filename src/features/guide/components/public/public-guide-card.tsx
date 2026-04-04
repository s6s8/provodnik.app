import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PublicGuideCardGuide = {
  id: string;
  name: string;
  avatarUrl: string;
  rating: number;
  tourCount: number;
  specialties: string[];
  cities: string[];
};

function toursWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "туров";
  if (mod10 === 1) return "тур";
  if (mod10 >= 2 && mod10 <= 4) return "тура";
  return "туров";
}

export function PublicGuideCard({
  guide,
  className,
}: {
  guide: PublicGuideCardGuide;
  className?: string;
}) {
  const ratingLabel = guide.rating.toFixed(1);

  return (
    <Link
      href={`/guide/${guide.id}`}
      className={cn(
        "bg-glass backdrop-blur-[20px] border border-white/10 shadow-glass flex gap-4 rounded-[1.5rem] p-4 transition-all duration-300",
        "items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg",
        className,
      )}
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/8">
        <Image
          src={guide.avatarUrl}
          alt=""
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base font-semibold text-white/95">
            {guide.name}
          </span>
          <span className="text-sm text-amber-300/95" aria-label={`Рейтинг ${ratingLabel}`}>
            ★ {ratingLabel}
          </span>
          <span className="text-xs text-white/50">
            {guide.tourCount} {toursWord(guide.tourCount)}
          </span>
        </div>

        {guide.specialties.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {guide.specialties.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="rounded-full border-white/10 bg-white/5 px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-normal text-white/70 normal-case"
              >
                {s}
              </Badge>
            ))}
          </div>
        ) : null}

        {guide.cities.length > 0 ? (
          <p className="text-xs text-white/45">{guide.cities.join(" · ")}</p>
        ) : null}
      </div>
    </Link>
  );
}

import { Star, BadgeCheck } from "lucide-react";

import { cn, pluralize } from "@/lib/utils";

type RatingDisplayProps = {
  rating?: number | null;
  reviewCount?: number | null;
  verified?: boolean;
  className?: string;
};

/** Zero-review → "Новый гид" chip (+ optional verified), NEVER "★0/0.0". >0 → amber star + rating + count. */
export function RatingDisplay({ rating, reviewCount, verified, className }: RatingDisplayProps) {
  const count = reviewCount ?? 0;
  if (count <= 0) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)}>
        <span className="inline-flex items-center rounded-full bg-surface-low px-2 py-0.5 text-on-surface-muted">
          Новый гид
        </span>
        {verified ? (
          <span className="inline-flex items-center gap-1 text-success">
            <BadgeCheck className="size-3.5" />
            Проверен
          </span>
        ) : null}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-on-surface-muted", className)}>
      <Star className="size-3.5 fill-current text-gold" />
      <span className="font-medium text-on-surface">{(rating ?? 0).toFixed(1)}</span>
      <span>
        · {count} {pluralize(count, "отзыв", "отзыва", "отзывов")}
      </span>
    </span>
  );
}

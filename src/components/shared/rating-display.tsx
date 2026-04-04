import { Star } from "lucide-react";

type RatingDisplayProps = {
  rating: number;
  reviewCount?: number;
  className?: string;
};

export function RatingDisplay({ rating, reviewCount, className }: RatingDisplayProps) {
  return (
    <div className={className ?? "flex items-center gap-2 text-sm text-ink-2"}>
      <span className="flex items-center gap-1 font-semibold text-ink">
        <Star className="size-4 fill-primary text-primary" />
        {rating.toFixed(1)}
      </span>
      {typeof reviewCount === "number" ? <span>· {reviewCount} отзывов</span> : null}
    </div>
  );
}

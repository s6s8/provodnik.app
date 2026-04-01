import { BadgeCheck, MapPinned, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function PublicGuideTrustMarkers({
  verificationStatus,
  rating,
  completedTours,
  reviewCount,
}: {
  verificationStatus: "draft" | "submitted" | "approved" | "rejected";
  rating: number;
  completedTours: number;
  reviewCount: number;
}) {
  const verified = verificationStatus === "approved";
  const hasReviews = reviewCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={verified ? "secondary" : "outline"} className="gap-1">
        <BadgeCheck className="size-3.5" />
        {verified ? "Проверен" : "Проверка профиля"}
      </Badge>

      {hasReviews ? (
        <Badge variant="outline" className="gap-1">
          <Star className="size-3.5 fill-current text-amber-500" />
          {rating.toFixed(1)} · {reviewCount} отзывов
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1">
          <Star className="size-3.5 fill-current text-amber-500" />
          Новый гид
        </Badge>
      )}

      <Badge variant="outline" className="gap-1">
        <MapPinned className="size-3.5" />
        {completedTours} завершённых туров
      </Badge>
    </div>
  );
}

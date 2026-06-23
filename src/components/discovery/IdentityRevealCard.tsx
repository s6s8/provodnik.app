import Image from "next/image"
import { Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type IdentityRevealCardProps = {
  name: string
  avatarUrl: string | null
  verified: boolean
  rating: number | null
  reviewCount: number
  tripsCompleted: number
  recommendPct: number | null
  className?: string
}

function IdentityRevealCard({
  name,
  avatarUrl,
  verified,
  rating,
  reviewCount,
  tripsCompleted,
  recommendPct,
  className,
}: IdentityRevealCardProps) {
  const hasRating = typeof rating === "number" && Number.isFinite(rating)
  const hasRecommend =
    typeof recommendPct === "number" && Number.isFinite(recommendPct)
  const initial = name.trim().charAt(0).toUpperCase()

  return (
    <div
      data-slot="identity-reveal-card"
      className={cn(
        "flex items-center gap-4 rounded-card border border-line bg-card p-4 shadow-soft",
        className
      )}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          data-slot="identity-avatar-fallback"
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
        >
          {initial}
        </span>
      )}

      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-base font-semibold text-on-surface">
            {name}
          </span>
          {verified ? <Badge variant="success">Проверен</Badge> : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {hasRating ? (
            <span
              data-slot="identity-rating"
              className="inline-flex items-center gap-1 font-semibold text-on-surface"
            >
              <Star className="size-4 fill-amber text-amber" aria-hidden="true" />
              {rating}
            </span>
          ) : null}
          <span>{reviewCount} отзывов</span>
          <span aria-hidden="true">·</span>
          <span>{tripsCompleted} поездок</span>
          {hasRecommend ? (
            <>
              <span aria-hidden="true">·</span>
              <span data-slot="identity-recommend">
                {recommendPct}% рекомендуют
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export { IdentityRevealCard }

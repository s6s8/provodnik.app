import Image from "next/image"
import Link from "next/link"
import { Compass, Star, Users } from "lucide-react"

import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

type DestinationCardProps = {
  name: string
  slug: string
  photoUrl: string
  guidesCount: number
  tourCount: number
  tagline?: string
  category?: string
  featured?: boolean
  rating?: number | null
  className?: string
}

function DestinationCard({
  name,
  slug,
  photoUrl,
  guidesCount,
  tourCount,
  tagline,
  category,
  featured,
  rating,
  className,
}: DestinationCardProps) {
  const hasRating = typeof rating === "number" && Number.isFinite(rating)

  return (
    <Link
      href={`/destinations/${slug}`}
      data-slot="destination-card"
      className={cn(
        "group relative block overflow-hidden rounded-card bg-surface-low shadow-soft transition-shadow hover:shadow-lift",
        featured ? "min-h-[320px]" : "min-h-[240px]",
        className
      )}
    >
      <Image
        src={photoUrl}
        alt={name}
        fill
        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 360px"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

      <div className="absolute inset-0 z-[1] flex flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-2">
          {category ? <Tag color="primary">{category}</Tag> : <span />}
          {hasRating ? (
            <span
              data-slot="destination-rating"
              className="inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-sm font-semibold text-on-surface backdrop-blur-[8px]"
            >
              <Star className="size-4 fill-amber text-amber" aria-hidden="true" />
              {rating}
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="font-display text-2xl font-semibold leading-tight text-primary-foreground">
            {name}
          </p>
          {tagline ? (
            <p className="text-sm text-primary-foreground/75">{tagline}</p>
          ) : null}
          <div className="mt-1 flex items-center gap-4 text-sm text-primary-foreground/80">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" aria-hidden="true" />
              {guidesCount} гидов
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Compass className="size-4" aria-hidden="true" />
              {tourCount} экскурсий
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export { DestinationCard }

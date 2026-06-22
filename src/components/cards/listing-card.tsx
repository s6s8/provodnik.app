import Link from "next/link"
import { Star } from "lucide-react"

import { AvatarStack } from "@/components/ui/avatar-stack"
import { Badge } from "@/components/ui/badge"
import { Chip } from "@/components/ui/chip"
import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

type ListingCardProps = {
  listing: {
    id: string
    slug: string
    title: string
    photoUrl: string
    destinationName?: string
    format?: string
    theme?: string
    groupSize?: string
    duration?: string
    inclusions?: string[]
    priceFrom?: number
    guide?: { name: string; avatarUrl?: string; verified?: boolean }
    rating?: number
    reviewCount?: number
  }
  className?: string
}

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n)

function ListingCard({ listing, className }: ListingCardProps) {
  const guide = listing.guide

  return (
    <Link href={`/listings/${listing.slug}`} className="group block">
      <div
        data-slot="listing-card"
        className={cn(
          "bg-card border border-line rounded-lg overflow-hidden group-hover:shadow-lift transition-shadow",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- card renders arbitrary remote photoUrl; no next/image loader configured */}
        <img
          src={listing.photoUrl}
          className="aspect-[4/3] w-full object-cover"
          alt={listing.title}
        />

        <div className="p-4 flex flex-col gap-2">
          <h3 className="text-base font-semibold text-on-surface line-clamp-2">
            {listing.title}
          </h3>

          {listing.destinationName ? (
            <p className="text-sm text-muted-foreground">
              {listing.destinationName}
            </p>
          ) : null}

          {listing.duration || listing.groupSize ? (
            <div className="flex flex-wrap items-center gap-2">
              {listing.duration ? (
                <Chip label="Срок" value={listing.duration} />
              ) : null}
              {listing.groupSize ? (
                <Chip label="Группа" value={listing.groupSize} />
              ) : null}
            </div>
          ) : null}

          {listing.theme ? <Tag color="primary">{listing.theme}</Tag> : null}

          {guide ? (
            <div className="flex items-center gap-2">
              <AvatarStack
                users={[{ name: guide.name, avatarUrl: guide.avatarUrl }]}
                size="compact"
              />
              <span className="text-sm font-medium text-on-surface">
                {guide.name}
              </span>
              {guide.verified ? (
                <Badge variant="success">Проверен</Badge>
              ) : null}
            </div>
          ) : null}

          {listing.rating != null ? (
            <div
              data-slot="listing-card-rating"
              className="flex items-center gap-1.5 text-sm text-on-surface"
            >
              <Star className="size-4 fill-amber text-amber" />
              <span className="font-semibold">{listing.rating}</span>
              {listing.reviewCount != null ? (
                <span className="text-muted-foreground">
                  ({listing.reviewCount})
                </span>
              ) : null}
            </div>
          ) : null}

          {listing.priceFrom != null ? (
            <p className="text-on-surface">
              <span className="text-sm text-muted-foreground">от </span>
              <span className="font-extrabold">{fmt(listing.priceFrom)} ₽</span>
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

export { ListingCard }

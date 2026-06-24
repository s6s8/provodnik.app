import Link from "next/link"

import { AvatarStack } from "@/components/ui/avatar-stack"
import { Badge } from "@/components/ui/badge"
import { StatStrip } from "@/components/ui/stat-strip"
import { formatRubNumber } from "@/data/money"
import { cn } from "@/lib/utils"

type GuideCardProps = {
  guide: {
    slug: string
    name: string
    avatarUrl?: string
    homeBase?: string
    bio?: string
    headline?: string
    verified?: boolean
    experienceYears?: number
    rating?: number
    reviewCount?: number
    responseRate?: number
    tripsCompleted?: number
    listingCount?: number
    priceFrom?: number
  }
  className?: string
}

const fmt = formatRubNumber

function GuideCard({ guide, className }: GuideCardProps) {
  const summary = guide.headline ?? guide.bio

  return (
    <Link href={`/guides/${guide.slug}`} className="group block">
      <div
        data-slot="guide-card"
        className={cn(
          "bg-card border border-line rounded-lg p-4 flex flex-col gap-3 group-hover:shadow-lift transition-shadow",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <AvatarStack
            users={[{ name: guide.name, avatarUrl: guide.avatarUrl }]}
            size="default"
          />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-on-surface">
                {guide.name}
              </span>
              {guide.verified ? (
                <Badge variant="success">Проверен</Badge>
              ) : null}
            </div>
            {guide.homeBase ? (
              <span className="text-sm text-muted-foreground">
                {guide.homeBase}
              </span>
            ) : null}
          </div>
        </div>

        {summary ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{summary}</p>
        ) : null}

        <StatStrip
          stats={[
            { label: "лет опыта", value: guide.experienceYears ?? null },
            { label: "поездок", value: guide.tripsCompleted ?? null },
            { label: "маршрутов", value: guide.listingCount ?? null },
            { label: "% ответов", value: guide.responseRate ?? null },
          ]}
        />

        {guide.priceFrom != null ? (
          <p className="text-on-surface">
            <span className="text-sm text-muted-foreground">от </span>
            <span className="font-extrabold">{fmt(guide.priceFrom)} ₽</span>
          </p>
        ) : null}

        <span className="inline-flex w-full items-center justify-center rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold text-on-surface transition-colors group-hover:bg-muted">
          Смотреть маршруты
        </span>
      </div>
    </Link>
  )
}

export { GuideCard }

import type { LucideIcon } from "lucide-react"
import { Fragment } from "react"

import { cn } from "@/lib/utils"

type StatStripItem = {
  icon?: LucideIcon
  label: string
  value: string | number | null
}

type StatStripProps = {
  stats: StatStripItem[]
  className?: string
}

function StatStrip({ stats, className }: StatStripProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground",
        className
      )}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon

        return (
          <Fragment key={index}>
            <span className="inline-flex items-center gap-1.5">
              {Icon ? <Icon className="size-4" /> : null}
              <span className="font-semibold text-on-surface">
                {stat.value === null ? "—" : stat.value}
              </span>
              {stat.label}
            </span>
            {index < stats.length - 1 ? (
              <span aria-hidden="true">·</span>
            ) : null}
          </Fragment>
        )
      })}
    </div>
  )
}

export { StatStrip }

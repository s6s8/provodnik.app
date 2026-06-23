import { BadgeCheck, MessageSquare, ShieldCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type TrustRibbonProps = {
  items?: string[]
  className?: string
}

const DEFAULT_ITEMS = [
  "Проверенные гиды",
  "Оплата при встрече",
  "Поддержка 24/7",
]

const ICONS: LucideIcon[] = [ShieldCheck, BadgeCheck, MessageSquare]

function TrustRibbon({ items, className }: TrustRibbonProps) {
  const signals = items ?? DEFAULT_ITEMS

  return (
    <div
      data-slot="trust-ribbon"
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground",
        className
      )}
    >
      {signals.map((label, index) => {
        const Icon = ICONS[index % ICONS.length]

        return (
          <span key={label} className="inline-flex items-center gap-2">
            <Icon className="size-4 text-success" aria-hidden="true" />
            {label}
          </span>
        )
      })}
    </div>
  )
}

export { TrustRibbon }

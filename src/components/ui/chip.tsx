import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type ChipProps = {
  label: string
  value: string
  icon?: LucideIcon
  className?: string
}

function Chip({ label, value, icon: Icon, className }: ChipProps) {
  return (
    <div
      data-slot="chip"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 shadow-soft",
        className
      )}
    >
      {Icon ? <Icon className="size-[18px] text-primary" /> : null}
      <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold text-on-surface">{value}</span>
    </div>
  )
}

export { Chip }

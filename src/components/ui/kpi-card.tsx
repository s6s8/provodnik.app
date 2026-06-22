import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type KpiCardProps = {
  value: string
  icon: LucideIcon
  iconTint?: "primary" | "amber" | "green"
  label: string
  delta?: string
  className?: string
}

const iconTints: Record<NonNullable<KpiCardProps["iconTint"]>, string> = {
  primary: "bg-primary-tint text-primary",
  amber: "bg-amber-tint text-amber",
  green: "bg-green-tint text-success",
}

function KpiCard({
  value,
  icon: Icon,
  iconTint = "primary",
  label,
  delta,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-line bg-card p-5 shadow-soft",
        className
      )}
    >
      <div
        data-slot="kpi-card-icon"
        className={cn(
          "grid size-[52px] place-items-center rounded-full",
          iconTints[iconTint]
        )}
      >
        <Icon className="size-6" />
      </div>
      <span className="text-4xl font-extrabold tracking-[-0.03em] text-on-surface">
        {value}
      </span>
      <span className="text-[13.5px] font-semibold text-muted-foreground">
        {label}
      </span>
      {delta ? <Badge variant="success">{delta}</Badge> : null}
    </div>
  )
}

export { KpiCard }

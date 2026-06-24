import { cn, pluralize } from "@/lib/utils"

type SeatProgressBarProps = {
  taken: number
  max: number | null
  className?: string
}

function SeatProgressBar({ taken, max, className }: SeatProgressBarProps) {
  if (max === null) {
    return (
      <p className={cn("text-sm font-medium text-on-surface", className)}>
        {taken} {pluralize(taken, "участник", "участника", "участников")}
      </p>
    )
  }

  const pct = Math.min(100, Math.round((taken / max) * 100))

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="h-2 w-full rounded-full bg-surface-low">
        <div
          role="progressbar"
          aria-valuenow={taken}
          aria-valuemin={0}
          aria-valuemax={max}
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        {taken} / {max} мест занято
      </p>
    </div>
  )
}

export { SeatProgressBar }

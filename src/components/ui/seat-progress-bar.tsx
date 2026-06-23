import { cn } from "@/lib/utils"

type SeatProgressBarProps = {
  taken: number
  max: number | null
  className?: string
}

function pluralizeParticipants(count: number): string {
  const mod100 = Math.abs(count) % 100
  const mod10 = mod100 % 10
  if (mod100 >= 11 && mod100 <= 14) return "участников"
  if (mod10 === 1) return "участник"
  if (mod10 >= 2 && mod10 <= 4) return "участника"
  return "участников"
}

function SeatProgressBar({ taken, max, className }: SeatProgressBarProps) {
  if (max === null) {
    return (
      <p className={cn("text-sm font-medium text-on-surface", className)}>
        {taken} {pluralizeParticipants(taken)}
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

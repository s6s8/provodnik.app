import { cn } from "@/lib/utils"

type CompletionBarProps = {
  completionPct: number
  label?: string
  className?: string
}

function CompletionBar({ completionPct, label, className }: CompletionBarProps) {
  const width = Math.max(0, Math.min(100, completionPct))

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        data-slot="completion-bar-track"
        className="h-1.5 w-full overflow-hidden rounded-pill bg-muted"
      >
        <div
          data-slot="completion-bar-fill"
          className="h-full rounded-pill bg-success"
          style={{ width: `${width}%` }}
        />
      </div>
      {label ? (
        <span className="text-[13.5px] font-semibold text-muted-foreground">
          {label}
        </span>
      ) : null}
    </div>
  )
}

export { CompletionBar }

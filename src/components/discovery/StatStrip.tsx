import { cn } from "@/lib/utils"

type StatStripProps = {
  guides: number
  tours: number
  activeGroups: number
  className?: string
}

function safeCount(value: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function StatStrip({ guides, tours, activeGroups, className }: StatStripProps) {
  const parts: Array<{ value: number; label: string }> = [
    { value: safeCount(guides), label: "гидов" },
    { value: safeCount(tours), label: "экскурсий" },
    { value: safeCount(activeGroups), label: "активных групп" },
  ]

  return (
    <p
      data-slot="discovery-stat-strip"
      className={cn(
        "flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground",
        className
      )}
    >
      {parts.map((part, index) => (
        <span key={part.label} className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="font-semibold text-on-surface">{part.value}</span>
            {part.label}
          </span>
          {index < parts.length - 1 ? (
            <span aria-hidden="true">·</span>
          ) : null}
        </span>
      ))}
    </p>
  )
}

export { StatStrip }

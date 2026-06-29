import { cn, pluralize } from "@/lib/utils"

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
  const guidesCount = safeCount(guides)
  const toursCount = safeCount(tours)
  const groupsCount = safeCount(activeGroups)
  const parts: Array<{ value: number; label: string }> = [
    { value: guidesCount, label: pluralize(guidesCount, "гид", "гида", "гидов") },
    { value: toursCount, label: pluralize(toursCount, "экскурсия", "экскурсии", "экскурсий") },
    {
      value: groupsCount,
      label: pluralize(groupsCount, "активная группа", "активные группы", "активных групп"),
    },
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

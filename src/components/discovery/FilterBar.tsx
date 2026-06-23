"use client"

import { cn } from "@/lib/utils"

type FilterChip = {
  id: string
  label: string
}

type FilterBarProps = {
  chips: FilterChip[]
  activeIds: string[]
  onToggle: (id: string) => void
  overflowLabel?: string
  className?: string
}

const MAX_VISIBLE = 6

function FilterBar({
  chips,
  activeIds,
  onToggle,
  overflowLabel,
  className,
}: FilterBarProps) {
  const visible = chips.slice(0, MAX_VISIBLE)
  const overflowCount = chips.length - visible.length

  return (
    <div data-slot="filter-bar" className={cn("relative", className)}>
      <div className="flex items-center gap-2 overflow-x-auto pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((chip) => {
          const active = activeIds.includes(chip.id)

          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(chip.id)}
              className={cn(
                "inline-flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-line bg-card text-on-surface hover:bg-primary-tint"
              )}
            >
              {chip.label}
            </button>
          )
        })}
        {overflowCount > 0 ? (
          <span className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-line bg-card px-4 text-sm font-semibold text-muted-foreground">
            {overflowLabel ?? `+${overflowCount}`}
          </span>
        ) : null}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent"
      />
    </div>
  )
}

export { FilterBar }

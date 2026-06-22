import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; href: string }
  iconColor?: "primary" | "amber" | "green"
  className?: string
}

const iconTints: Record<NonNullable<EmptyStateProps["iconColor"]>, string> = {
  primary: "bg-primary-tint text-primary",
  amber: "bg-amber-tint text-amber",
  green: "bg-green-tint text-success",
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconColor = "primary",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 py-12 text-center",
        className
      )}
    >
      <div
        data-slot="empty-state-icon"
        className={cn(
          "grid size-16 place-items-center rounded-full",
          iconTints[iconColor]
        )}
      >
        <Icon className="size-7" />
      </div>
      <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
      {description ? (
        <p className="text-muted-foreground">{description}</p>
      ) : null}
      {action ? (
        <Button asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  )
}

export { EmptyState }

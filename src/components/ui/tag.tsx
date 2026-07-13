import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Thin wrapper over Badge, kept for its `color` API and the existing call-sites.
 * Badge is the only pill in the system — Tag maps onto its tinted variants so
 * the text tones stay AA (the old amber/green tags were 2.5:1 and 3.5:1 on their
 * own tints).
 */
const badgeVariantByColor = {
  primary: "info",
  amber: "warning",
  green: "success",
} as const

type TagProps = {
  color: keyof typeof badgeVariantByColor
  children: ReactNode
  className?: string
}

function Tag({ color, children, className }: TagProps) {
  return (
    <Badge
      data-slot="tag"
      variant={badgeVariantByColor[color]}
      className={cn("h-auto border-transparent px-2 py-0.5", className)}
    >
      {children}
    </Badge>
  )
}

export { Tag }

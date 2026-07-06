import type { ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[13.5px] font-semibold",
  {
    variants: {
      color: {
        primary: "bg-primary-tint text-primary",
        amber: "bg-amber-tint text-amber",
        green: "bg-green-tint text-success",
      },
    },
  }
)

type TagProps = {
  color: NonNullable<VariantProps<typeof tagVariants>["color"]>
  children: ReactNode
  className?: string
}

function Tag({ color, children, className }: TagProps) {
  return (
    <span data-slot="tag" className={cn(tagVariants({ color }), className)}>
      {children}
    </span>
  )
}

export { Tag, tagVariants }

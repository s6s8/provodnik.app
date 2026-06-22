import { cn } from "@/lib/utils"

type SkeletonVariant = "line" | "card" | "avatar" | "chip" | "hero"

const variantClasses: Record<SkeletonVariant, string> = {
  line: "h-4 w-full rounded-md",
  card: "h-[200px] w-full rounded-lg",
  avatar: "size-[46px] rounded-full",
  chip: "h-8 w-20 rounded-pill",
  hero: "h-[260px] w-full rounded-hero",
}

type SkeletonProps = React.ComponentProps<"div"> & {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
}

function Skeleton({ className, variant = "line", width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse bg-muted", variantClasses[variant], className)}
      style={width !== undefined || height !== undefined ? { width, height, ...style } : style}
      {...props}
    />
  )
}

export { Skeleton }

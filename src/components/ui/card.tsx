import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  variant = "flat",
  padding = "default",
  shadow = true,
  border = true,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  variant?: "flat" | "glass"
  padding?: "sm" | "default" | "lg"
  shadow?: boolean
  border?: boolean
}) {
  const isGlass = variant === "glass"

  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col overflow-hidden text-sm text-card-foreground gap-5 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0",
        padding === "lg" && "py-6 data-[size=sm]:py-4",
        padding === "default" && "py-5 data-[size=sm]:py-4",
        padding === "sm" && "py-4 data-[size=sm]:py-4",
        isGlass
          ? cn(
              "bg-glass backdrop-blur-xl rounded-glass *:[img:first-child]:rounded-t-glass *:[img:last-child]:rounded-b-glass",
              border && "border border-glass-border",
              shadow && "shadow-glass"
            )
          : cn(
              "bg-card rounded-lg",
              border && "border border-line",
              shadow && "shadow-soft"
            ),
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-[1.9rem] px-5 group-data-[size=sm]/card:px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-5 group-data-[size=sm]/card:[.border-b]:pb-4",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      role="heading"
      aria-level={3}
      className={cn(
        "text-base leading-snug font-semibold group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-5 group-data-[size=sm]/card:px-4", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-[1.9rem] border-t border-border/60 bg-muted p-5 group-data-[size=sm]/card:p-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

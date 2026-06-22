"use client"

import { X } from "lucide-react"

import { cn } from "@/lib/utils"

function AlertDismiss({
  className,
  onDismiss,
}: {
  className?: string
  onDismiss?: () => void
}) {
  return (
    <button
      type="button"
      data-slot="alert-dismiss"
      aria-label="Закрыть"
      onClick={onDismiss}
      className={cn(
        "absolute top-2 right-2 inline-flex size-5 items-center justify-center rounded-sm text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
    >
      <X className="size-4" />
    </button>
  )
}

export { AlertDismiss }

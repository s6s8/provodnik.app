import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { AvatarStack } from "@/components/ui/avatar-stack"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type BookingCardProps = {
  eyebrow?: string
  price: number
  priceSuffix?: string
  note?: string
  momentum?: { avatarUrls: string[]; label: string }
  trustLines?: Array<{ icon: LucideIcon; text: string }>
  action: ReactNode
  className?: string
}

const priceFormatter = new Intl.NumberFormat("ru-RU")

function BookingCard({
  eyebrow,
  price,
  priceSuffix = "/ с человека",
  note,
  momentum,
  trustLines,
  action,
  className,
}: BookingCardProps) {
  return (
    <div
      data-slot="booking-card"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-line bg-card p-5 shadow-soft",
        className
      )}
    >
      <Badge variant="eyebrow">{eyebrow ?? "Бронирование"}</Badge>

      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tracking-[-0.03em] text-on-surface">
          {priceFormatter.format(price)} ₽
        </span>
        <span className="text-sm text-muted-foreground">{priceSuffix}</span>
      </div>

      {note ? (
        <div
          data-slot="booking-card-note"
          className="rounded-lg bg-green-tint px-3 py-2 text-sm text-success"
        >
          {note}
        </div>
      ) : null}

      {momentum ? (
        <div className="flex items-center gap-2">
          <AvatarStack
            users={momentum.avatarUrls.map((u) => ({ name: "", avatarUrl: u }))}
            size="compact"
          />
          <span className="size-2 rounded-full bg-amber" />
          <span className="text-sm text-muted-foreground">{momentum.label}</span>
        </div>
      ) : null}

      {action}

      {trustLines && trustLines.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          {trustLines.map(({ icon: Icon, text }, index) => (
            <div key={index} className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export { BookingCard }

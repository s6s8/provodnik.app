"use client"

import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { AvatarStack } from "@/components/ui/avatar-stack"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type NotificationItemProps = {
  kind: string
  icon?: LucideIcon
  senderName?: string
  senderAvatar?: string
  subjectPill?: string
  message: string
  timestamp: string
  href: string
  isRead?: boolean
}

function NotificationItem({
  icon: Icon,
  senderName,
  senderAvatar,
  subjectPill,
  message,
  timestamp,
  href,
  isRead = false,
}: NotificationItemProps) {
  const hasSender = Boolean(senderAvatar || senderName)

  return (
    <Link href={href}>
      <div
        data-slot="notification-item"
        className={cn(
          "flex min-h-[44px] items-start gap-3 border-l-4 px-4 py-3",
          isRead
            ? "border-transparent bg-muted"
            : "border-primary bg-card"
        )}
      >
        {hasSender ? (
          <AvatarStack
            users={[{ name: senderName ?? "", avatarUrl: senderAvatar }]}
            size="compact"
          />
        ) : Icon ? (
          <span className="grid size-9 place-items-center rounded-full bg-primary-tint text-primary">
            <Icon className="size-4" />
          </span>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {senderName ? (
              <span className="font-semibold text-on-surface">{senderName}</span>
            ) : null}
            {subjectPill ? (
              <Badge variant="info">{subjectPill}</Badge>
            ) : null}
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{message}</p>
        </div>

        <span className="text-xs text-muted-foreground">{timestamp}</span>
      </div>
    </Link>
  )
}

export { NotificationItem }
